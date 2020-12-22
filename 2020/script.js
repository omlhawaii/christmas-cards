import * as THREE from "https://threejs.org/build/three.module.js";

/** @type {THREE.OrthographicCamera} */
let camera;
/** @type {THREE.Scene} */
let scene;
/** @type {THREE.WebGLRenderer} */
let renderer;
/** @type {THREE.PointsMaterial} */
let material;
/** @type {THREE.Float32BufferAttribute} */
let positions;
/** @type {Worker} */
let worker;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

const numPoints = 200;

init();
animate();

function init() {
  camera = new THREE.OrthographicCamera(
    -windowHalfX,
    windowHalfX,
    -windowHalfY,
    windowHalfY,
    1,
    2000
  );
  camera.position.z = 1000;

  scene = new THREE.Scene();

  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(3 * numPoints);

  const textureLoader = new THREE.TextureLoader();

  const sprite = textureLoader.load(`Snow_flake.png`);

  positions = new THREE.Float32BufferAttribute(vertices, 3);
  geometry.setAttribute("position", positions);

  worker = new Worker("worker.js");
  worker.addEventListener("message", (evt) => {
    /** @type {Float32Array} */
    const newPositions = evt.data;
    positions.array.set(newPositions);
    positions.needsUpdate = true;
  });

  material = new THREE.PointsMaterial({
    size: 20,
    alphaMap: sprite,
    map: sprite,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  worker.postMessage({ roomSize: [windowHalfX, windowHalfY], numPoints });
  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.left = -windowHalfX;
  camera.right = windowHalfX;
  camera.top = -windowHalfY;
  camera.bottom = windowHalfY;
  camera.updateProjectionMatrix();

  worker.postMessage({ roomSize: [windowHalfX, windowHalfY], numPoints });
  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  const time = Date.now() * 0.00005;

  renderer.render(scene, camera);
}
