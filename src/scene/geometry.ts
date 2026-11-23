import * as THREE from 'three';

type BodySection = { z: number; width: number; lower: number; shoulder: number; top: number };

function loftGeometry(sections: BodySection[], canopy = false) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const ringSize = 8;

  sections.forEach(({ z, width: w, lower, shoulder, top }) => {
    const ring: [number, number][] = canopy
      ? [
          [-w * 0.88, lower], [-w, shoulder], [-w * 0.72, top - 0.05], [0, top],
          [w * 0.72, top - 0.05], [w, shoulder], [w * 0.88, lower], [0, lower - 0.025],
        ]
      : [
          [-w * 0.88, lower], [-w, shoulder], [-w * 0.86, top - 0.06], [0, top],
          [w * 0.86, top - 0.06], [w, shoulder], [w * 0.88, lower], [0, lower - 0.045],
        ];
    ring.forEach(([x, y]) => vertices.push(x, y, z));
  });

  for (let section = 0; section < sections.length - 1; section += 1) {
    for (let point = 0; point < ringSize; point += 1) {
      const next = (point + 1) % ringSize;
      const a = section * ringSize + point;
      const b = section * ringSize + next;
      const c = (section + 1) * ringSize + next;
      const d = (section + 1) * ringSize + point;
      indices.push(a, b, d, b, c, d);
    }
  }

  for (let point = 1; point < ringSize - 1; point += 1) {
    indices.push(0, point + 1, point);
    const offset = (sections.length - 1) * ringSize;
    indices.push(offset, offset + point, offset + point + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createBodyGeometry() {
  return loftGeometry([
    { z: -2.38, width: 0.72, lower: 0.36, shoulder: 0.48, top: 0.59 },
    { z: -2.18, width: 0.98, lower: 0.3, shoulder: 0.62, top: 0.77 },
    { z: -1.48, width: 1.08, lower: 0.28, shoulder: 0.72, top: 0.91 },
    { z: -0.72, width: 1.0, lower: 0.31, shoulder: 0.68, top: 0.79 },
    { z: 0.5, width: 1.0, lower: 0.31, shoulder: 0.69, top: 0.82 },
    { z: 1.45, width: 1.1, lower: 0.29, shoulder: 0.75, top: 0.96 },
    { z: 2.15, width: 0.98, lower: 0.35, shoulder: 0.7, top: 0.86 },
    { z: 2.28, width: 0.78, lower: 0.42, shoulder: 0.63, top: 0.74 },
  ]);
}

export function createCanopyGeometry() {
  return loftGeometry([
    { z: -0.93, width: 0.63, lower: 0.78, shoulder: 0.82, top: 0.9 },
    { z: -0.55, width: 0.77, lower: 0.8, shoulder: 1.03, top: 1.27 },
    { z: 0.2, width: 0.74, lower: 0.82, shoulder: 1.16, top: 1.43 },
    { z: 0.78, width: 0.65, lower: 0.82, shoulder: 1.1, top: 1.34 },
    { z: 1.18, width: 0.5, lower: 0.8, shoulder: 0.88, top: 0.96 },
  ], true);
}

export function createSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(255,255,255,0.52)');
  gradient.addColorStop(0.3, 'rgba(230,235,240,0.3)');
  gradient.addColorStop(0.68, 'rgba(190,200,210,0.09)');
  gradient.addColorStop(1, 'rgba(160,175,190,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(0,0,0,0.75)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.4)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
