import { readFile, writeFile } from 'node:fs/promises';
import { Box3, Group, Matrix4, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

globalThis.FileReader ??= class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const [exteriorPath, interiorPath] = process.argv.slice(2);
if (!exteriorPath || !interiorPath) throw new Error('Usage: node scripts/prepare-model.mjs exterior.glb interior.glb');
const loader = new GLTFLoader();
const load = async (path) => loader.parseAsync(Uint8Array.from(await readFile(path)).buffer, '');
const [exterior, interior] = await Promise.all([load(exteriorPath), load(interiorPath)]);
const assemblies = new Map();
const orientation = new Matrix4().makeRotationY(-Math.PI / 2);
const exteriorTransform = orientation.clone().multiply(new Matrix4().makeTranslation(-2.35, 0, 0));
const interiorTransform = orientation.clone().multiply(new Matrix4().makeScale(0.86, 0.85, 0.88))
  .multiply(new Matrix4().makeTranslation(-2.43, 0, 0));

function collect(id, mesh, transform) {
  if (!assemblies.has(id)) assemblies.set(id, new Map());
  const byMaterial = assemblies.get(id);
  if (!byMaterial.has(mesh.material)) byMaterial.set(mesh.material, []);
  const geometry = mesh.geometry.clone();
  for (const attribute of Object.keys(geometry.attributes)) {
    if (attribute !== 'position' && attribute !== 'normal') geometry.deleteAttribute(attribute);
  }
  if (!geometry.index) geometry.setIndex(Array.from({length: geometry.attributes.position.count}, (_, index) => index));
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  geometry.applyMatrix4(transform.clone().multiply(mesh.matrixWorld));
  byMaterial.get(mesh.material).push(geometry);
}

const nodeName = (object) => object.userData.name ?? object.name.replaceAll('_', ' ');
const wheelCenters = new Map();
exterior.scene.updateMatrixWorld(true);
exterior.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const name = nodeName(mesh);
  const wheel = name.match(/^(FL|FR|RL|RR) /);
  let id = 'body';
  if (wheel) {
    const corner = wheel[1].toLowerCase();
    id = /brake disc|caliper|disc hole/.test(name) ? 'brake-' + corner : 'wheel-' + corner;
    wheelCenters.set(corner, mesh.parent.getWorldPosition(new Vector3()).applyMatrix4(exteriorTransform));
  } else if (/^Canopy|^Roof rail/.test(name)) id = 'canopy';
  else if (/^Front (?!wheel)|^Headlamp/.test(name)) id = 'fascia-front';
  else if (/^Diffuser|^Rear (?:light|lower bumper|vent)/.test(name)) id = 'fascia-rear';
  else if (/^Nacelle|^Rear (?:gas|nozzle|deck fairing)|^Thruster nacelle/.test(name)) id = 'nacelle';
  else if (/^Mirror/.test(name)) id = mesh.position.z > 0 ? 'mirror-l' : 'mirror-r';
  else if (/^Thruster /.test(name)) {
    id = 'thruster-' + (mesh.position.x < 0 ? 'f' : 'r') + (mesh.position.z > 0 ? 'l' : 'r');
  }
  collect(id, mesh, exteriorTransform);
});

// Interior surfaces came from a longer body. Normalize the wheelbase first,
// then adjust each subassembly in vehicle coordinates to clear the white shell.
interior.scene.updateMatrixWorld(true);
interior.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const name = nodeName(mesh);
  let id;
  let offset = 0;
  if (/^4680|^Battery |^Cell |^Module |^Copper cell|^BMS/.test(name)) {
    id = 'battery';
    if (/socket|washer|Module lid screw|fastener|perimeter/.test(name)) return;
    offset = -0.07;
  } else if (/^CFRP |^Sill aluminum|^Subframe (?:crossmember|longitudinal)|^Suspension wishbone|^Damper |^Spring perch|^Steering (?:rack|tie rod)|^Tie rod/.test(name)) {
    id = 'chassis';
    offset = -0.015;
  } else if (/^Seat |^Harness|^Head restraint|^Dashboard|^Center OLED|^OLED UI|^Metal pedal|^Steering column|^Yoke/.test(name)) {
    id = 'cockpit';
    offset = -0.13;
  } else if (/PMSM|^Inverter (?:heat|lid$|lid\.)|^Motor (?:cooling|end cap)|^Output bearing|^Rear dual inverter|^Main radiator|^Low radiator|^Radiator |^Coolant/.test(name)) {
    id = mesh.position.x < 2.43 ? 'drive-front' : 'drive-rear';
    offset = -0.085;
  } else if (/^Fan |^Duct (?!flange)|^Brushless motor|^Spinner|^Stator guide/.test(name)) {
    id = mesh.position.x < 2.43 ? 'fan-front' : 'fan-rear';
    offset = -0.19;
    if (Math.abs(mesh.position.z) < 0.35 || (mesh.position.x > 2.0 && mesh.position.x < 2.75)) return;
  } else if (/^Tank |^COPV |^Pressure transducer|^Safety relief|^Solenoid|^Gas distribution|^Manifold fitting|^Valve pipe|^CGT compressor|^Compressor/.test(name)) {
    id = 'tanks';
    offset = -0.21;
  } else return;

  const transform = new Matrix4().makeTranslation(0, offset, 0).multiply(interiorTransform);
  if (/^fan/.test(id)) transform.premultiply(new Matrix4().makeScale(0.85, 1, 1));
  if (id === 'tanks') transform.premultiply(new Matrix4().makeScale(0.88, 1, 0.83));
  if (id === 'fan-front') transform.premultiply(new Matrix4().makeTranslation(0, 0, -0.17));
  collect(id, mesh, transform);
});

const scene = new Group();
scene.name = 'Roadster_2_Concept';
for (const [id, byMaterial] of assemblies) {
  const part = new Group();
  part.name = id;
  const bounds = new Box3();
  for (const [material, geometries] of byMaterial) {
    const merged = mergeGeometries(geometries);
    if (!merged) throw new Error('Could not merge ' + id + ' / ' + material.name);
    merged.computeBoundingBox();
    bounds.union(merged.boundingBox);
    part.add(new Mesh(merged, material));
  }
  const pivot = wheelCenters.get(id.replace(/^(wheel|brake)-/, '')) ?? bounds.getCenter(new Vector3());
  for (const mesh of part.children) mesh.geometry.translate(-pivot.x, -pivot.y, -pivot.z);
  part.position.copy(pivot);
  scene.add(part);
  console.log(id, part.children.length, bounds.min.toArray().map(x => x.toFixed(2)).join(','), bounds.max.toArray().map(x => x.toFixed(2)).join(','));
}
if (assemblies.size !== 27) throw new Error('Expected 27 assemblies, got ' + assemblies.size);
const baked = await new GLTFExporter().parseAsync(scene, { binary: true });
await writeFile(new URL('../public/models/roadster.glb', import.meta.url), Buffer.from(baked));
