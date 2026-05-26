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
