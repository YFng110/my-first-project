// js/bike.js — 自行车 + 骑手简化几何体模型

import * as THREE from 'three';

export function createBike(scene) {
  const bike = new THREE.Group();
  scene.add(bike);

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xdd3333,
    roughness: 0.3,
    metalness: 0.7
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.6
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffcc99,
    roughness: 0.7,
    metalness: 0
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0x3344aa,
    roughness: 0.8,
    metalness: 0
  });

  // 前轮
  const frontWheel = createWheel(darkMat);
  frontWheel.position.set(0, 0.55, 0.95);
  bike.add(frontWheel);

  // 后轮
  const rearWheel = createWheel(darkMat);
  rearWheel.position.set(0, 0.55, -0.8);
  bike.add(rearWheel);

  // 车架主体 — 上管
  const topTube = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.08, 1.2),
    frameMat
  );
  topTube.position.set(0, 0.9, 0.05);
  topTube.rotation.x = 0.15;
  bike.add(topTube);

  // 下管
  const downTube = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.08, 1.1),
    frameMat
  );
  downTube.position.set(0, 0.55, 0.05);
  downTube.rotation.x = -0.25;
  bike.add(downTube);

  // 座管
  const seatTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6),
    frameMat
  );
  seatTube.position.set(0, 0.95, -0.3);
  bike.add(seatTube);

  // 座垫
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.06, 0.3),
    darkMat
  );
  seat.position.set(0, 1.3, -0.3);
  bike.add(seat);

  // 头管
  const headTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6),
    frameMat
  );
  headTube.position.set(0, 0.95, 0.7);
  bike.add(headTube);

  // 车把
  const handlebar = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.04, 0.1),
    darkMat
  );
  handlebar.position.set(0, 1.15, 0.72);
  bike.add(handlebar);

  // 前叉
  const fork = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6),
    darkMat
  );
  fork.position.set(0, 0.7, 0.95);
  fork.rotation.x = 0.3;
  bike.add(fork);

  // === 骑手 ===
  const rider = new THREE.Group();

  // 躯干
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.45, 0.2),
    clothMat
  );
  torso.position.set(0, 1.65, -0.15);
  torso.rotation.x = 0.35;
  rider.add(torso);

  // 头部
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    skinMat
  );
  head.position.set(0, 2.05, 0.1);
  rider.add(head);

  // 头盔
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.5 })
  );
  helmet.position.set(0, 2.08, 0.1);
  rider.add(helmet);

  // 左臂
  const leftArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.5, 6),
    clothMat
  );
  leftArm.position.set(-0.18, 1.8, 0.15);
  leftArm.rotation.z = 0.8;
  leftArm.rotation.x = -0.3;
  rider.add(leftArm);

  // 右臂
  const rightArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.5, 6),
    clothMat
  );
  rightArm.position.set(0.18, 1.8, 0.15);
  rightArm.rotation.z = -0.8;
  rightArm.rotation.x = -0.3;
  rider.add(rightArm);

  // 左腿
  const leftLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x333355, roughness: 0.8 })
  );
  leftLeg.position.set(-0.1, 1.2, -0.3);
  leftLeg.rotation.x = 0.5;
  rider.add(leftLeg);

  // 右腿
  const rightLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x333355, roughness: 0.8 })
  );
  rightLeg.position.set(0.1, 1.2, -0.3);
  rightLeg.rotation.x = -0.3;
  rider.add(rightLeg);

  bike.add(rider);

  // 整体前倾姿态
  bike.rotation.x = -0.08;

  return bike;
}

function createWheel(mat) {
  const wheel = new THREE.Group();

  // 外胎
  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.06, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  );
  tire.rotation.y = Math.PI / 2;
  wheel.add(tire);

  // 轮圈
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.02, 6, 20),
    mat
  );
  rim.rotation.y = Math.PI / 2;
  wheel.add(rim);

  // 辐条 — 几根细线
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.64, 4),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 })
    );
    spoke.position.x = Math.cos(angle) * 0.16;
    spoke.position.y = Math.sin(angle) * 0.16;
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = angle;
    wheel.add(spoke);
  }

  return wheel;
}
