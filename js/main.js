// js/main.js — 入口，初始化各模块

import { createScene } from './scene.js';
import { createTerrain } from './terrain.js';
import { createForest } from './forest.js';
import { createBike } from './bike.js';
import { initAnimation, startAnimationLoop } from './animation.js';

function init() {
  // WebGL 检测
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    document.getElementById('fallback').classList.remove('hidden');
    return;
  }

  const { scene, camera, renderer } = createScene();
  const { ground, path } = createTerrain(scene);
  createForest(scene, path);
  const bike = createBike(scene);

  initAnimation(scene, camera, renderer, path, bike);
  startAnimationLoop();

  // 粒子效果 — 漂浮光点
  createParticles(scene, path);
}

function createParticles(scene, path) {
  const count = 300;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const pt = path.getPointAt(t);
    positions[i * 3] = pt.x + (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = pt.y + Math.random() * 15;
    positions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 30;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffcc,
    size: 0.08,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(geom, mat);
  scene.add(particles);

  // 粒子缓慢漂浮动画
  function animateParticles() {
    requestAnimationFrame(animateParticles);
    const pos = particles.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.002;
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }
  animateParticles();
}

init();
