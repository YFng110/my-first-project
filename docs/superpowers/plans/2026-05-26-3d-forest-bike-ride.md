# 3D 森林自行车骑行场景动画 — 实现计划

> **致执行者:** 按任务顺序执行。每步完成后验证。使用 `superpowers:executing-plans` 或 `superpowers:subagent-driven-development` 技能来执行。

**目标:** 构建一个使用 Three.js 的 3D 森林自动巡航动画网页，第一人称视角模拟骑山地自行车穿越森林

**架构:** Three.js 场景驱动，模块化 JS 文件各司其职（场景/地形/树木/自行车/动画），通过 import map 从 CDN 加载 Three.js。所有模块由 main.js 入口统一初始化，动画循环在 animation.js 中集中管理。

**技术栈:** Three.js (CDN import map) / vanilla JS (ES modules) / HTML5 + CSS3

---

### Task 1: 创建 HTML 入口页面

**文件:**
- 创建: `index.html`
- 创建: `styles.css`

- [ ] **Step 1: 编写 HTML 骨架**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>森林骑行</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="container"></div>

  <div id="hint" class="hint">
    拖拽鼠标环顾四周 | 滚轮调节速度
  </div>

  <div id="speed-display" class="speed-display hidden">1.0x</div>

  <div id="fallback" class="fallback hidden">
    请使用支持 WebGL 的现代浏览器查看此页面
  </div>

  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
    }
  }
  </script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 编写 CSS 样式**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0a;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

#container {
  width: 100%;
  height: 100%;
}

#container canvas {
  display: block;
}

.hint {
  position: fixed;
  top: 20px;
  right: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.8;
  pointer-events: none;
  transition: opacity 2s ease;
  z-index: 10;
}

.hint.fade-out {
  opacity: 0;
}

.speed-display {
  position: fixed;
  top: 20px;
  right: 20px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: bold;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.speed-display.hidden {
  opacity: 0;
}

.fallback {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 18px;
  background: #1a1a2e;
  z-index: 100;
}

.fallback.hidden {
  display: none;
}
```

- [ ] **Step 3: 提交**

```bash
git add index.html styles.css
git commit -m "feat: add HTML entry page and base styles"
```

---

### Task 2: 创建场景模块

**文件:**
- 创建: `js/scene.js`

- [ ] **Step 1: 编写场景初始化模块**

```js
// js/scene.js — 场景、渲染器、相机、光照、雾

let scene, camera, renderer;

export function createScene() {
  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.00015);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.getElementById('container').appendChild(renderer.domElement);

  // 相机 — 后续由动画模块控制位置
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 2.5, 0);

  // 光照
  setupLights();

  // 响应式
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

function setupLights() {
  // 环境光 — 补光，避免暗部太黑
  const ambient = new THREE.AmbientLight(0x406040, 0.6);
  scene.add(ambient);

  // 半球光 — 天空/地面渐变
  const hemi = new THREE.HemisphereLight(0xffeedd, 0x446633, 0.7);
  scene.add(hemi);

  // 主方向光 — 模拟太阳，投射阴影
  const sun = new THREE.DirectionalLight(0xfff0dd, 2.5);
  sun.position.set(50, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 150;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.0001;
  scene.add(sun);

  // 体积光模拟 — 多个半透明平面叠加
  for (let i = 0; i < 5; i++) {
    const planeGeom = new THREE.PlaneGeometry(8, 30);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xfffbe8,
      transparent: true,
      opacity: 0.015,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const plane = new THREE.Mesh(planeGeom, planeMat);
    plane.position.set(10 + i * 3, 12, 0);
    plane.rotation.y = Math.random() * 0.5;
    plane.rotation.x = -0.3;
    plane.renderOrder = 999;
    plane.material.depthTest = false;
    scene.add(plane);
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add js/scene.js
git commit -m "feat: add Three.js scene setup with lighting and fog"
```

---

### Task 3: 创建地形模块

**文件:**
- 创建: `js/terrain.js`

- [ ] **Step 1: 编写地形和路径生成**

```js
// js/terrain.js — 地形几何体 + 路径曲线

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
  const pathGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);

  // 创建路径面片 — 沿线扩展成带状
  const width = 1.5;
  const vertices = [];
  const indices = [];

  for (let i = 0; i < curvePoints.length; i++) {
    const pt = curvePoints[i];
    const tangent = i < curvePoints.length - 1
      ? new THREE.Vector3().subVectors(curvePoints[i + 1], pt).normalize()
      : new THREE.Vector3().subVectors(pt, curvePoints[i - 1]).normalize();
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
```

- [ ] **Step 2: 提交**

```bash
git add js/terrain.js
git commit -m "feat: add terrain with height displacement and winding path"
```

---

### Task 4: 创建森林树木模块

**文件:**
- 创建: `js/forest.js`

- [ ] **Step 1: 编写树木生成**

```js
// js/forest.js — 使用 InstancedMesh 批量生成树木

export function createForest(scene, path) {
  const treeGroup = new THREE.Group();
  scene.add(treeGroup);

  // 针叶树几何体片段 — 多层锥形构成
  const pineGeom = createPineGeometry();
  const pineMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.8,
    metalness: 0
  });

  // 树干几何体
  const trunkGeom = new THREE.CylinderGeometry(0.12, 0.18, 3, 6);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a1e,
    roughness: 0.95,
    metalness: 0
  });

  // 放置树木
  const treeCount = 600;
  for (let i = 0; i < treeCount; i++) {
    const tree = createTree(
      i === 0 ? pineGeom : null,
      pineMat, trunkGeom, trunkMat,
      path
    );
    treeGroup.add(tree);
  }

  // 合并树木为 InstancedMesh 以减少 draw calls
  return treeGroup;
}

function createPineGeometry() {
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
    const mesh = new THREE.Mesh(cone, null);
    mesh.position.y = layer.y;
    group.add(mesh);
  }

  return group;
}

function createTree(pineGeom, pineMat, trunkGeom, trunkMat, path) {
  const tree = new THREE.Group();

  // 随机位置 — 分布在路径两侧
  const pathPoint = path.getPointAt(Math.random());
  const tangent = path.getTangentAt(Math.random()).normalize();
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

  // 树冠 — 每个树克隆几何体
  const crown = new THREE.Mesh(pineGeom ? pineGeom.clone() : createPineGeometry(), pineMat);
  crown.castShadow = true;
  crown.receiveShadow = true;
  crown.position.y = 3.2;
  tree.add(crown);

  return tree;
}
```

- [ ] **Step 2: 提交**

```bash
git add js/forest.js
git commit -m "feat: add forest generation with trees along path"
```

---

### Task 5: 创建自行车 + 骑手模型

**文件:**
- 创建: `js/bike.js`

- [ ] **Step 1: 编写自行车模型构建**

```js
// js/bike.js — 自行车 + 骑手简化几何体模型

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
```

- [ ] **Step 2: 提交**

```bash
git add js/bike.js
git commit -m "feat: add bike and rider 3D model"
```

---

### Task 6: 创建动画和交互模块

**文件:**
- 创建: `js/animation.js`

- [ ] **Step 1: 编写相机动画和输入处理**

```js
// js/animation.js — 相机路径动画 + 鼠标/滚轮交互

let clock, path, camera, bike;
let speedMultiplier = 1.0;
let lookOffsetX = 0;       // 鼠标横向偏移
let targetLookOffsetX = 0;
let speedDisplayTimer = 0;

export function initAnimation(scene, _camera, _path, _bike) {
  camera = _camera;
  path = _path;
  bike = _bike;
  clock = new THREE.Clock();

  setupInput();
}

function setupInput() {
  // 鼠标拖拽偏移视角
  let isDragging = false;
  let lastMouseX = 0;

  window.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    targetLookOffsetX = 0;
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.clientX - lastMouseX;
      targetLookOffsetX += dx * 0.005;
      targetLookOffsetX = THREE.MathUtils.clamp(targetLookOffsetX, -0.8, 0.8);
      lastMouseX = e.clientX;
    }
  });

  // 滚轮调节速度
  window.addEventListener('wheel', (e) => {
    speedMultiplier -= e.deltaY * 0.002;
    speedMultiplier = THREE.MathUtils.clamp(speedMultiplier, 0.3, 2.5);
    showSpeedDisplay();
  });

  // 移动端触摸
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastMouseX = e.touches[0].clientX;
    }
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
    targetLookOffsetX = 0;
  });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastMouseX;
      targetLookOffsetX += dx * 0.005;
      targetLookOffsetX = THREE.MathUtils.clamp(targetLookOffsetX, -0.8, 0.8);
      lastMouseX = e.touches[0].clientX;
    }
  });
}

function showSpeedDisplay() {
  const el = document.getElementById('speed-display');
  el.textContent = speedMultiplier.toFixed(1) + 'x';
  el.classList.remove('hidden');
  speedDisplayTimer = 1.5;
}

export function startAnimationLoop() {
  // 隐藏初始提示
  setTimeout(() => {
    document.getElementById('hint').classList.add('fade-out');
  }, 5000);

  // 路径进度
  let pathProgress = 0;
  const baseSpeed = 0.02; // 基础速度（路径百分比/秒）

  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);

    // 更新速度显示计时器
    if (speedDisplayTimer > 0) {
      speedDisplayTimer -= dt;
      if (speedDisplayTimer <= 0) {
        document.getElementById('speed-display').classList.add('hidden');
      }
    }

    // 平滑过渡视角偏移
    lookOffsetX = THREE.MathUtils.lerp(lookOffsetX, targetLookOffsetX, 1 - Math.exp(-5 * dt));

    // 更新路径进度
    pathProgress += baseSpeed * speedMultiplier * dt;
    if (pathProgress > 0.999) pathProgress = 0;

    // 获取路径上当前位置
    const pt = path.getPointAt(pathProgress);

    // 微颠簸效果
    const bump = Math.sin(pathProgress * 120) * 0.03 + Math.sin(pathProgress * 75) * 0.02;
    pt.y += 2.5 + bump;

    // 更新相机位置
    camera.position.copy(pt);

    // 获取前向方向
    const lookAhead = path.getPointAt(Math.min(pathProgress + 0.005, 0.999));
    const forward = new THREE.Vector3().subVectors(lookAhead, pt).normalize();

    // 转弯倾斜 (roll)
    const nextLookAhead = path.getPointAt(Math.min(pathProgress + 0.02, 0.999));
    const nextForward = new THREE.Vector3().subVectors(nextLookAhead, lookAhead).normalize();
    const cross = new THREE.Vector3().crossVectors(forward, nextForward);
    const rollAngle = cross.y * 8;
    camera.rotation.z = rollAngle + bump * 0.3;

    // 计算视线目标 — 前方 + 横向偏移
    const lookTarget = pt.clone()
      .add(forward.multiplyScalar(10))
      .add(new THREE.Vector3(-forward.z, 0, forward.x).multiplyScalar(lookOffsetX * 8));
    lookTarget.y += 1.2;

    camera.lookAt(lookTarget);

    // 更新自行车位置和朝向
    const bikePos = pt.clone();
    bikePos.y -= 1.7;
    bike.position.copy(bikePos);
    bike.position.y += bump;
    bike.rotation.y = Math.atan2(forward.x, forward.z);
    bike.rotation.z = rollAngle * 0.6;

    // 车轮旋转
    const wheelSpeed = speedMultiplier * baseSpeed * 60;
    bike.children.forEach(child => {
      if (child.children.length > 1 && child.children[0].geometry?.type === 'TorusGeometry') {
        child.rotation.x += wheelSpeed * dt * 12;
      }
    });
  }

  animate();
}
```

- [ ] **Step 2: 提交**

```bash
git add js/animation.js
git commit -m "feat: add camera path animation and input handling"
```

---

### Task 7: 创建主入口文件并串联所有模块

**文件:**
- 创建: `js/main.js`

- [ ] **Step 1: 编写主入口**

```js
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
  const forest = createForest(scene, path);
  const bike = createBike(scene);

  initAnimation(scene, camera, path, bike);
  startAnimationLoop();

  // 粒子效果 — 漂浮光点
  createParticles(scene, path);
}

function createParticles(scene, path) {
  const count = 300;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const pt = path.getPointAt(Math.random());
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
```

- [ ] **Step 2: 提交**

```bash
git add js/main.js
git commit -m "feat: add main entry point and particle effects"
```

---

### Task 8: 视觉验证与微调

- [ ] **Step 1: 在浏览器中打开运行**

在项目目录下启动本地服务器并打开 `index.html`，验证：
- 场景正常渲染（天空、地面、树木、路径）
- 相机自动沿路径移动
- 树木分布在路径两侧
- 自行车模型在画面底部中央
- 雾效和粒子可见
- 鼠标拖拽偏移视角，松手回正
- 滚轮调节速度并显示倍率
- 移动端可触摸交互

- [ ] **Step 2: 根据视觉效果微调参数**

需要关注的参数（直接在代码中调整）：
- `js/scene.js`: fog 密度、光照强度、体积光透明度
- `js/terrain.js`: 地形起伏幅度 (amp1/amp2/amp3)、路径宽度和蜿蜒程度
- `js/forest.js`: 树木密度 (treeCount)、分布范围 (distFromPath)
- `js/animation.js`: 相机高度偏移 (2.5)、颠簸强度、转弯倾斜程度

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "tweak: final visual parameter adjustments"
```
