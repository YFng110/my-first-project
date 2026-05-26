// js/forest.js — 使用 Group 批量生成树木

export function createForest(scene, path) {
  const treeGroup = new THREE.Group();
  scene.add(treeGroup);

  const pineMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.8,
    metalness: 0
  });

  const trunkGeom = new THREE.CylinderGeometry(0.12, 0.18, 3, 6);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a1e,
    roughness: 0.95,
    metalness: 0
  });

  // 放置树木
  const treeCount = 600;
  for (let i = 0; i < treeCount; i++) {
    const tree = createTree(pineMat, trunkGeom, trunkMat, path);
    treeGroup.add(tree);
  }

  return treeGroup;
}

function createPineCrown() {
  const group = new THREE.Group();

  // 四层锥形树冠
  const layers = [
    { y: 0.8, r: 1.4, h: 2.2 },
    { y: 1.8, r: 1.1, h: 1.8 },
    { y: 2.7, r: 0.8, h: 1.5 },
    { y: 3.5, r: 0.5, h: 1.2 },
  ];

  for (const layer of layers) {
    const cone = new THREE.ConeGeometry(layer.r, layer.h, 8, 2);
    const mesh = new THREE.Mesh(cone);
    mesh.position.y = layer.y;
    group.add(mesh);
  }

  return group;
}

function createTree(pineMat, trunkGeom, trunkMat, path) {
  const tree = new THREE.Group();

  // 随机位置 — 分布在路径两侧
  const t = Math.random();
  const pathPoint = path.getPointAt(t);
  const tangent = path.getTangentAt(Math.min(t + 0.001, 0.999)).normalize();
  const sideDir = Math.random() > 0.5 ? 1 : -1;
  const distFromPath = 3 + Math.random() * 35;
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

  const x = pathPoint.x + side.x * sideDir * distFromPath;
  const z = pathPoint.z + side.z * sideDir * distFromPath;
  const y = pathPoint.y - 0.3 + Math.random() * 0.5;

  tree.position.set(x, y, z);
  tree.rotation.y = Math.random() * Math.PI * 2;

  const scale = 0.6 + Math.random() * 1.4;
  tree.scale.setScalar(scale);

  // 树干
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  trunk.position.y = 1.5;
  tree.add(trunk);

  // 树冠
  const crown = createPineCrown();
  crown.traverse(child => {
    if (child.isMesh) {
      child.material = pineMat;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  crown.position.y = 3.2;
  tree.add(crown);

  return tree;
}
