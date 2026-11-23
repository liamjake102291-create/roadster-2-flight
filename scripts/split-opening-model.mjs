import { readFile, writeFile } from 'node:fs/promises';

const INTERNAL = new Set(['chassis', 'battery', 'drive-front', 'drive-rear', 'fan-front', 'fan-rear', 'tanks']);

export async function splitOpeningModel(original, destination) {
  const source = await readFile(original);
  const jsonLength = source.readUInt32LE(12);
  const document = JSON.parse(source.subarray(20, 20 + jsonLength));
  const binary = source.subarray(28 + jsonLength);
  const root = document.nodes.findIndex((node) => node.name === 'Roadster_2_Concept');
  if (root < 0 || document.buffers.length !== 1 || document.images?.length || document.animations?.length) {
    throw Error('Unexpected Roadster display model layout');
  }

  for (const interior of [false, true]) {
    const nodes = [], meshes = [], accessors = [], bufferViews = [], data = [];
    const lookup = { nodes: new Map(), meshes: new Map(), accessors: new Map(), bufferViews: new Map() };
    let offset = 0;
    const copy = (key, oldIndex, values, map) => {
      if (lookup[key].has(oldIndex)) return lookup[key].get(oldIndex);
      const index = values.length;
      lookup[key].set(oldIndex,index);
      const value = structuredClone(document[key][oldIndex]);
      values.push(value);
      map(value,oldIndex);
      return index;
    };
    const copyView = (idx) => copy('bufferViews',idx,bufferViews,(view) => {
      const aligned = (offset + 3) & ~3;
      if (aligned > offset) data.push(Buffer.alloc(aligned-offset));
      const start = view.byteOffset ?? 0;
      data.push(binary.subarray(start,start + view.byteLength));
      view.byteOffset = aligned;
      offset = aligned + view.byteLength;
    });
    const copyAccessor = (idx) => copy('accessors',idx,accessors,(accessor) => {
      if (accessor.sparse || accessor.bufferView === undefined) throw Error('Unsupported sparse accessor');
      accessor.bufferView = copyView(accessor.bufferView);
    });
    const copyMesh = (idx) => copy('meshes',idx,meshes,(mesh) => {
      for (const primitive of mesh.primitives) {
        if (primitive.targets || primitive.extensions) throw Error('Unexpected primitive extension');
        if (primitive.indices !== undefined) primitive.indices = copyAccessor(primitive.indices);
        for (const key of Object.keys(primitive.attributes)) primitive.attributes[key] = copyAccessor(primitive.attributes[key]);
      }
    });
    const copyNode = (idx) => copy('nodes',idx,nodes,(node) => {
      if (node.mesh !== undefined) node.mesh = copyMesh(node.mesh);
      if (node.children) {
        const children = idx === root
          ? node.children.filter((id) => INTERNAL.has(document.nodes[id].name) === interior)
          : node.children;
        node.children = children.map(copyNode);
      }
    });
    const scenes = document.scenes.map((scene) => ({ ...scene, nodes: scene.nodes.map(copyNode) }));
    const bin = Buffer.concat([...data,Buffer.alloc(((offset + 3) & ~3) - offset)]);
    const json = Buffer.from(JSON.stringify({
      ...document, scenes, nodes, meshes, accessors, bufferViews, buffers: [{byteLength:bin.length}],
    }));
    const padded = Buffer.concat([json,Buffer.alloc((4 - json.length % 4) % 4,32)]);
    const header = Buffer.alloc(20);
    header.write('glTF'); header.writeUInt32LE(2,4); header.writeUInt32LE(28+padded.length+bin.length,8);
    header.writeUInt32LE(padded.length,12); header.write('JSON',16);
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(bin.length); binHeader.write('BIN\0',4);
    await writeFile(new URL(interior ? 'roadster-interior.glb' : 'roadster-opening.glb',destination),
      Buffer.concat([header,padded,binHeader,bin]));
  }
}
