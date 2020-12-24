import * as THREE from "https://threejs.org/build/three.module.js";
import { Vector3 } from "https://threejs.org/build/three.module.js";

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
/** @type {THREE.Sprite} */
let snowMachine;
/** @type {THREE.Sprite} */
let background;
/** @type {THREE.Mesh} */
let cover;
/** @type {THREE.MeshBasicMaterial} */
let coverMaterial;

const frustumSize = 500;
let aspect = window.innerWidth / window.innerHeight;

const numPoints = 10000;

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    1,
    1000
  );
  camera.position.set(0, 0, 200);
  camera.lookAt(scene.position);

  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(3 * numPoints);

  const textureLoader = new THREE.TextureLoader();

  const sprite = textureLoader.load(`Snow_flake.png`);

  const houseWarmTexture = textureLoader.load("img/housea-warm.jpg");
  const houseColdTexture = textureLoader.load("img/housea-cold.jpg");

  const elf0 = textureLoader.load("img/screwy0.png");
  const elf1 = textureLoader.load("img/screwy1.png");
  const elf2 = textureLoader.load("img/screwy2.png");
  const elfMaterial = new THREE.SpriteMaterial({
    map: elf0,
  });
  const elf = new THREE.Sprite(elfMaterial);
  elf.position.set(0, -150, 0);
  elf.scale.set(85, 100, 1);
  scene.add(elf);

  const houseMaterial = new THREE.SpriteMaterial({
    map: houseWarmTexture,
  });
  background = new THREE.Sprite(houseMaterial);
  background.position.z = -3;
  background.scale.set(frustumSize * aspect, frustumSize, 1);
  scene.add(background);

  positions = new THREE.Float32BufferAttribute(vertices, 3);
  geometry.setAttribute("position", positions);

  worker = new Worker("worker.js");
  worker.addEventListener("message", (evt) => {
    /** @type {Float32Array} */
    const newPositions = evt.data.positions;
    /** @type {0 | 1 | 2} */
    const phase = evt.data.phase;

    positions.array.set(newPositions);
    positions.needsUpdate = true;
    coverMaterial.opacity = evt.data.coverOpacity;
    houseMaterial.map = phase === 2 ? houseColdTexture : houseWarmTexture;
    elfMaterial.map = phase === 0 ? elf0 : phase === 1 ? elf1 : elf2;
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

  const machineMaterial = new THREE.SpriteMaterial({
    map: textureLoader.load("img/snow-machine.png"),
  });
  snowMachine = new THREE.Sprite(machineMaterial);
  snowMachine.position.set(55, -150, 0);
  snowMachine.scale.set(100, 100, 1);
  scene.add(snowMachine);

  //

  const coverGeometry = new THREE.PlaneGeometry(
    frustumSize * aspect,
    frustumSize
  );
  coverMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.FrontSide,
    transparent: true,
    opacity: 0,
  });
  cover = new THREE.Mesh(coverGeometry, coverMaterial);
  cover.position.z = 1;
  scene.add(cover);

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  initWorker();
  window.addEventListener("resize", onWindowResize, false);
}

function initWorker() {
  worker.postMessage({
    roomSize: [(frustumSize * aspect) / 2, frustumSize / 2],
    numPoints,
    startPos: [snowMachine.position.x, snowMachine.position.y + 40],
  });
}

function onWindowResize() {
  aspect = window.innerWidth / window.innerHeight;

  camera.left = (frustumSize * aspect) / -2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;
  camera.updateProjectionMatrix();

  const coverGeometry = new THREE.PlaneGeometry(
    frustumSize * aspect,
    frustumSize
  );
  cover.geometry = coverGeometry;

  initWorker();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  renderer.render(scene, camera);
}
