// js/animation.js — 相机路径动画 + 鼠标/滚轮交互

let clock, path, camera, bike, renderer, scene;
let speedMultiplier = 1.0;
let lookOffsetX = 0;
let targetLookOffsetX = 0;
let speedDisplayTimer = 0;

export function initAnimation(_scene, _camera, _renderer, _path, _bike) {
  scene = _scene;
  camera = _camera;
  renderer = _renderer;
  path = _path;
  bike = _bike;
  clock = new THREE.Clock();

  setupInput();
}

function setupInput() {
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
      if (child.type === 'Group' && child.children.length > 0) {
        const firstChild = child.children[0];
        if (firstChild.geometry && firstChild.geometry.type === 'TorusGeometry') {
          child.rotation.x += wheelSpeed * dt * 12;
        }
      }
    });

    renderer.render(scene, camera);
  }

  animate();
}
