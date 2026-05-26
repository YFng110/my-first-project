// js/terrain.js — 地形几何体 + 路径曲线

import * as THREE from 'three';

export function createTerrain(scene) {
  // 地面 — 带起伏的平面
  const size = 200;
  const segments = 150;
  const geom = new THREE.PlaneGeometry(size, size, segments, segments);
  geom.rotateX(-Math.PI / 2);

  // 位移顶点生成起伏地形
  const positions = geom.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    positions[i + 1] = getTerrainHeight(x, z);
  }
  geom.computeVertexNormals();

  // 顶点颜色 — 绿色到棕色渐变（低处偏绿，高处偏棕）
  const colors = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const h = (y + 3) / 8;
    const r = 0.25 + h * 0.35;
    const g = 0.35 + (1 - h) * 0.25;
    const b = 0.12 + h * 0.1;
    colors[i] = r;
    colors[i + 1] = g;
    colors[i + 2] = b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false
  });

  const ground = new THREE.Mesh(geom, mat);
  ground.receiveShadow = true;
  scene.add(ground);

  // 路径曲线
  const path = createPath();
  addPathVisual(scene, path);

  return { ground, path };
}

// Simplex-like 地形高度函数
function getTerrainHeight(x, z) {
  const freq1 = 0.03, amp1 = 3.5;
  const freq2 = 0.08, amp2 = 1.2;
  const freq3 = 0.2, amp3 = 0.3;

  let h = 0;
  h += Math.sin(x * freq1) * Math.cos(z * freq1 * 0.8) * amp1;
  h += Math.sin(x * freq2 + 1.5) * Math.cos(z * freq2 * 1.1) * amp2;
  h += Math.sin(x * freq3 + 3.0) * Math.sin(z * freq3 * 0.7) * amp3;
  return h;
}

// 生成 CatmullRom 路径曲线
function createPath() {
  const points = [];
  const segments = 40;
  const totalLength = 180;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * totalLength - totalLength / 2;
    // 路径在 x 轴上蜿蜒
    const x = Math.sin(z * 0.04) * 12 + Math.sin(z * 0.12) * 5;
    const y = getTerrainHeight(x, z) + 0.1;
    points.push(new THREE.Vector3(x, y, z));
  }

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

// 可视化路径（贴在地面上的半透明带）
function addPathVisual(scene, path) {
  const curvePoints = path.getPoints(200);
  const width = 1.5;
  const vertices = [];
  const indices = [];

  for (let i = 0; i < curvePoints.length; i++) {
    const pt = curvePoints[i];
    const nextPt = i < curvePoints.length - 1 ? curvePoints[i + 1] : pt;
    const prevPt = i > 0 ? curvePoints[i - 1] : pt;
    const tangent = i < curvePoints.length - 1
      ? new THREE.Vector3().subVectors(nextPt, pt).normalize()
      : new THREE.Vector3().subVectors(pt, prevPt).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const left = pt.clone().add(side.clone().multiplyScalar(width / 2));
    const right = pt.clone().add(side.clone().multiplyScalar(-width / 2));
    left.y = getTerrainHeight(left.x, left.z) + 0.12;
    right.y = getTerrainHeight(right.x, right.z) + 0.12;

    vertices.push(left.x, left.y, left.z);
    vertices.push(right.x, right.y, right.z);

    if (i < curvePoints.length - 1) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  const stripGeom = new THREE.BufferGeometry();
  stripGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  stripGeom.setIndex(indices);
  stripGeom.computeVertexNormals();

  const stripMat = new THREE.MeshStandardMaterial({
    color: 0x8B7355,
    roughness: 1.0,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: true
  });

  const strip = new THREE.Mesh(stripGeom, stripMat);
  strip.receiveShadow = true;
  scene.add(strip);
}
