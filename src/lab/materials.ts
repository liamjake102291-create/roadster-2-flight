import * as THREE from 'three';

function makeCanvas(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

/** 金色碳纤维缠绕纹理：环向束 + 斜向交叉菱形编织。 */
export function createCarbonTexture(base = '#c8a24b', dark = '#7a5a24') {
  const size = 256;
  const canvas = makeCanvas(size);
  const context = canvas.getContext('2d')!;
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);
  const weave = 20;
  context.strokeStyle = dark;
  context.globalAlpha = 0.32;
  for (let x = -size; x < size; x += weave) {
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + size, size);
    context.stroke();
    context.beginPath();
    context.moveTo(x + size, 0);
    context.lineTo(x, size);
    context.stroke();
  }
  context.globalAlpha = 0.22;
  context.lineWidth = 2.4;
  for (let y = 0; y < size; y += weave) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(size, y);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/** 电池包网格面板纹理。 */
export function createGridTexture(color = '#3a3f45', line = '#0c0e10') {
  const size = 128;
  const canvas = makeCanvas(size);
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, size, size);
  const cell = 16;
  context.strokeStyle = line;
  context.lineWidth = 1.5;
  for (let x = 0; x <= size; x += cell) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, size);
    context.stroke();
  }
  for (let y = 0; y <= size; y += cell) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(size, y);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** 电机散热槽纹理（横向环槽，映射到圆柱轴向）。 */
export function createFinTexture(color = '#aeb5bb', line = '#2b3035') {
  const size = 128;
  const canvas = makeCanvas(size);
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = line;
  context.lineWidth = 2;
  for (let y = 0; y <= size; y += 7) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(size, y);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
