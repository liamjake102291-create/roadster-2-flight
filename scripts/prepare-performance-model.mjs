import { readFile, writeFile } from 'node:fs/promises';
import { BufferAttribute, BufferGeometry } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import meshoptimizer from 'meshoptimizer';

const { MeshoptSimplifier } = meshoptimizer;
globalThis.FileReader ??= class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};
await MeshoptSimplifier.ready;
const original = new URL('../public/models/roadster.glb', import.meta.url);
const { scene } = await new GLTFLoader().parseAsync(Uint8Array.from(await readFile(original)).buffer, '');
let triangles = 0;
scene.traverse((mesh) => {
  if (!mesh.isMesh || !mesh.geometry.index) return;
  const geometry = mergeVertices(mesh.geometry, 0.0002);
  const position = geometry.attributes.position;
  const indices = Uint32Array.from(geometry.index.array);
  const detail = /body|canopy|wheel|fascia|cockpit/i.test(mesh.parent.name);
  const target = Math.max(36, Math.floor(indices.length * (detail ? 0.18 : 0.045) / 3) * 3);
  let [simplified] = MeshoptSimplifier.simplify(indices, position.array, 3, target, detail ? 0.023 : 0.085);
  if (!detail && indices.length > 3000) {
    const cell = mesh.parent.name === 'battery' ? 0.022 : 0.014;
    const vertices = new Map();
    const remapped = new Uint32Array(position.count);
    for (let i = 0; i < position.count; i++) {
      const key = [position.getX(i), position.getY(i), position.getZ(i)].map((value) => Math.floor(value / cell)).join(':');
      if (!vertices.has(key)) vertices.set(key, i);
      remapped[i] = vertices.get(key);
    }
    const faces = new Set();
    const clustered = [];
    for (let i = 0; i < simplified.length; i += 3) {
      const a = remapped[simplified[i]], b = remapped[simplified[i + 1]], c = remapped[simplified[i + 2]];
      if (a === b || b === c || c === a) continue;
      const key = [a, b, c].sort((x, y) => x - y).join(':');
      if (faces.has(key)) continue;
      faces.add(key);
      clustered.push(a, b, c);
    }
    if (clustered.length) simplified = Uint32Array.from(clustered);
  }
  const [remap, count] = MeshoptSimplifier.compactMesh(simplified);
  const compact = new BufferGeometry();
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const values = new Float32Array(count * attribute.itemSize);
    for (let i = 0; i < remap.length; i++) {
      const destination = remap[i];
      if (destination === 0xffffffff) continue;
      for (let component = 0; component < attribute.itemSize; component++) {
        values[destination * attribute.itemSize + component] = attribute.array[i * attribute.itemSize + component];
      }
    }
    compact.setAttribute(name, new BufferAttribute(values, attribute.itemSize));
  }
  compact.setIndex(Array.from(simplified));
  mesh.geometry = compact;
  triangles += simplified.length / 3;
});
const output = await new GLTFExporter().parseAsync(scene, { binary: true });
await writeFile(new URL('../public/models/roadster-performance.glb', import.meta.url), Buffer.from(output));
console.log('Display model:',triangles,'triangles;',output.byteLength,'bytes');
