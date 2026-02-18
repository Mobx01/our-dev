import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import { ScrollTrigger } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger/+esm";

gsap.registerPlugin(ScrollTrigger);
// Improve mobile scroll behavior
ScrollTrigger.config({
  ignoreMobileResize: true
});

// Normalize touch scrolling
ScrollTrigger.normalizeScroll(true);

// ==========================
// DEVICE OPTIMIZATION
// ==========================

const isMobile = window.innerWidth < 1024;
const MAX_PIXEL_RATIO = isMobile ? 1.5 : 2;

// ==========================
// MASTER CONTROLS
// ==========================

const nameSideOffset = 3;
const triggerDistance = 1.2;

const amplitude = isMobile ? 3 : 4.5;
const frequency = 1;
const waveStretch = 1.8;

const boxCount = 5;
const boxSpacingMultiplier = 1;
const boxInset = 0.65;

const cameraHeight = 0.6;
const lookAheadDistance = 1.5;

// ==========================
// SCENE SETUP
// ==========================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0xFF00FF, 40);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, cameraHeight, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
function getViewportSize() {
  const width = window.visualViewport
    ? window.visualViewport.width
    : window.innerWidth;

  const height = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;

  return { width, height };
}

// Initial size
const { width, height } = getViewportSize();

renderer.setSize(width, height);
camera.aspect = width / height;
camera.updateProjectionMatrix();

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

// ==========================
// WAVE FUNCTION
// ==========================

function getWaveX(z) {
  const t = -z * 0.1 * waveStretch;
  const raw = (2 / Math.PI) * Math.asin(Math.sin(frequency * t));
  return amplitude * raw * 0.75;
}

// ==========================
// SVG LOADING
// ==========================

const textureLoader = new THREE.TextureLoader();
const svgTexture = textureLoader.load('./public/models/snowman.png');

const svgMaterial = new THREE.MeshBasicMaterial({
  map: svgTexture,
  transparent: true
});

const svgGeometry = new THREE.PlaneGeometry(2, 2);

// ==========================
// NAME TAG CREATOR
// ==========================

function createNameTag(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 512;
  canvas.height = 256;

  ctx.fillStyle = "white";
  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1
  });

  const geometry = new THREE.PlaneGeometry(3, 1.5);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(0.6, 0.6, 0.6);
  mesh.position.set()

  return mesh;
}

// ==========================
// BOX CREATION (SINGLE WAVE)
// ==========================

const characters = [];

function createWave() {

  for (let n = 0; n < boxCount; n++) {

    const baseZ = -(Math.PI/2 + n * Math.PI) / (frequency * 0.1 * waveStretch);
    const z = baseZ * boxSpacingMultiplier;

    const x = getWaveX(z) * boxInset;

    const mesh = new THREE.Mesh(svgGeometry, svgMaterial);
    
    

    // Create name
    const nameTag = createNameTag(`BOX ${n + 1}`);

    const isRightBox = x > 0;

if (isMobile) {

  // 📱 Mobile & Tablet → place below character
  mesh.position.set(
    // x-0.2,
    isRightBox ? x + 0.2 : x - 0.2,
    cameraHeight,
    z
  )
  nameTag.position.set(
    isRightBox ? x + 0.2 : x-0.2,                      // align with character center
    cameraHeight - 1.5,     // below character
    z
  );

} else {

  // 🖥 Desktop → keep your original side logic
  const isRightBox = x > 0;

  nameTag.position.set(
    isRightBox ? 1 + nameSideOffset : nameSideOffset - 7,
    cameraHeight,
    z
  );
  mesh.position.set(x, cameraHeight , z);
}

    scene.add(mesh);
    scene.add(nameTag);
  }
}


createWave();

// ==========================
// SCROLL CAMERA
// ==========================

const endZ = isMobile ? -75 : -95;


gsap.to(camera.position, {
  z: endZ,
  ease: "none",
  scrollTrigger: {
    trigger: "#scrollArea",
    start: "top top",
    end: "bottom bottom",
    scrub: isMobile ? 1.5 : 1,
  },
  onUpdate: () => {

    // Camera wave motion
    camera.position.x = getWaveX(camera.position.z);
    camera.position.y = cameraHeight;

    const targetTilt = -camera.position.x * 0.15;
    camera.rotation.z += (targetTilt - camera.rotation.z) * 0.08;

    const lookZ = camera.position.z - lookAheadDistance;
    const lookX = getWaveX(camera.position.z);
    camera.lookAt(lookX, cameraHeight, lookZ);

    // Box trigger logic


  }
});


// ==========================
// RENDER LOOP
// ==========================

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  if(camera.position.z )
  console.log('camera pos',camera.position.z);
}
animate();

// ==========================
// RESIZE HANDLING
// ==========================

function handleResize() {

  const { width, height } = getViewportSize();

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(width, height);

  ScrollTrigger.refresh();
}

window.addEventListener("resize", handleResize);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
}
//-6 -24 -4  -58 -75
