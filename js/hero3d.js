import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const hero = document.getElementById('hero');
const canvas = document.getElementById('hero-canvas');
const loaderEl = document.getElementById('loader');
const loaderPct = document.getElementById('loader-pct');
const loaderFill = document.getElementById('loader-fill');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;

const BG = 0x0b0d12;
const ACCENT = 0xe11d2e;

// Reveal the hero copy once the loader is gone
function revealHeroText() {
  loaderEl.classList.add('done');
  if (gsap && !reduceMotion) {
    gsap.from('.hero-anim', { y: 30, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
  }
}

function fallback() {
  document.documentElement.classList.add('no-webgl');
  revealHeroText();
}

// ---------- Renderer ----------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  console.warn('WebGL unavailable, using static hero.', err);
}

if (renderer) init();
else fallback();

function init() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 9, 22);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const lookTarget = new THREE.Vector3(0, 0.55, 0);

  // ---------- Floor: grid + soft contact shadow ----------
  const grid = new THREE.GridHelper(40, 40, 0x3a3f4b, 0x3a3f4b);
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  grid.material.depthWrite = false;
  scene.add(grid);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.9, metalness: 0, envMapIntensity: 0.15 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.002;
  scene.add(floor);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 5.4),
    new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false, toneMapped: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;

  // Red accent glow under the car
  const glow = new THREE.PointLight(ACCENT, 6, 6, 2);
  glow.position.set(0, 0.25, 0);
  scene.add(glow);

  // ---------- Materials ----------
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: ACCENT, metalness: 1.0, roughness: 0.45, clearcoat: 1.0, clearcoatRoughness: 0.03
  });
  const detailsMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0 });

  // ---------- Model ----------
  const car = new THREE.Group();
  car.add(shadow);
  scene.add(car);
  const wheels = [];

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  gltfLoader.load(
    'assets/models/ferrari.glb',
    (gltf) => {
      const model = gltf.scene.children[0];
      model.getObjectByName('body').material = bodyMat;
      ['rim_fl', 'rim_fr', 'rim_rr', 'rim_rl', 'trim'].forEach((n) => (model.getObjectByName(n).material = detailsMat));
      model.getObjectByName('glass').material = glassMat;
      ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].forEach((n) => wheels.push(model.getObjectByName(n)));
      car.add(model);

      loaderPct.textContent = '100%';
      loaderFill.style.width = '100%';
      setTimeout(() => { revealHeroText(); playIntro(); }, 300);
    },
    (xhr) => {
      if (!xhr.total) return;
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      loaderPct.textContent = pct + '%';
      loaderFill.style.width = pct + '%';
    },
    (err) => {
      console.error('Failed to load car model:', err);
      fallback();
    }
  );

  // ---------- Camera state (animated by GSAP, eased each frame) ----------
  const cam = {
    angle: 2.35,       // base orbit angle (radians) – front-3/4 view
    radius: 8.5,
    height: 1.7,
    scrollAngle: 0,    // added by scroll
    scrollRadius: 0,
    wheelSpeed: reduceMotion ? 0 : 1.2, // revolutions / second
    gridSpeed: reduceMotion ? 0 : 1
  };
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  function playIntro() {
    if (!gsap || reduceMotion) return;
    // Car drives in from the distance, camera dollies in
    gsap.from(car.position, { z: -14, duration: 2.6, ease: 'power3.out' });
    gsap.from(cam, { radius: 13, height: 3.6, angle: 1.4, duration: 2.8, ease: 'power3.out' });
    gsap.fromTo(cam, { wheelSpeed: 6, gridSpeed: 4 }, { wheelSpeed: 1.2, gridSpeed: 1, duration: 2.6, ease: 'power2.out' });
  }

  // Camera orbits and pulls back as the hero scrolls away
  if (gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.to(cam, {
      scrollAngle: Math.PI / 2,
      scrollRadius: 3,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 }
    });
  }

  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // ---------- Resize (shift framing right on wide screens so text stays readable) ----------
  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (w >= 900) {
      camera.setViewOffset(w, h, -w * 0.14, 0, w, h);
      camera.fov = 38;
    } else {
      // On mobile the car sits in the band under the navbar (see .hero padding-top)
      const carCenter = 72 + Math.min(w * 0.58, 260) / 2;
      camera.setViewOffset(w, h, 0, h / 2 - carCenter, w, h);
      camera.fov = w / h < 0.8 ? 62 : 42; // portrait phones need a wider lens
    }
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- Render loop (paused while hero is offscreen) ----------
  const clock = new THREE.Clock();
  let autoAngle = 0;
  let running = true;

  new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting;
    if (running) { clock.getDelta(); renderer.setAnimationLoop(tick); }
    else renderer.setAnimationLoop(null);
  }).observe(hero);

  function tick() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!reduceMotion) autoAngle += dt * 0.12;
    eased.x += (pointer.x - eased.x) * 0.05;
    eased.y += (pointer.y - eased.y) * 0.05;

    const angle = cam.angle + autoAngle + cam.scrollAngle + eased.x * 0.35;
    const radius = cam.radius + cam.scrollRadius;
    camera.position.set(
      Math.sin(angle) * radius,
      cam.height + eased.y * -0.4 + cam.scrollRadius * 0.3,
      Math.cos(angle) * radius
    );
    camera.lookAt(lookTarget);

    const spin = dt * cam.wheelSpeed * Math.PI * 2;
    wheels.forEach((w) => (w.rotation.x -= spin));
    grid.position.z = (grid.position.z - dt * cam.gridSpeed) % 1;

    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(tick);
}

// Radial gradient used as a fake contact shadow under the car
function makeShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 128, 10, 64, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.9)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
