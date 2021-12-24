import * as THREE from "https://threejs.org/build/three.module.js";

/** @typedef {Parameters<typeof ornament>[0]} OrnamentData */

/** @type {THREE.PerspectiveCamera} */
let camera;
/** @type {THREE.Scene} */
let scene;
/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {Map<THREE.Group, OrnamentData>} */
let ornaments = new Map();

let mouseX = 0,
  mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

const portraitMedia = window.matchMedia("(orientation: portrait)");

init();
animate();

/**
 *
 * @param {object} data
 * @param {string} data.front Image URL to stick on the front of the ornament
 * @param {string} data.back Image URL to stick on the back of the ornament
 * @param {number} [data.rotate] Rate of rotation
 * @param {number} [data.color] Color to use on ornament ring and sides
 * @param {number} [data.radius] Radius of the ornament.
 * @param {THREE.Vector3} data.position Position of the ornament
 * @param {THREE.Vector3} [data.portrait] Position of the ornament in portrait view
 */
function ornament(data) {
  const {
    front,
    back,
    radius = 100,
    color = 0xdcb869,
    position = new THREE.Vector3(),
  } = data;

  const loader = new THREE.TextureLoader();
  /** @type {THREE.Material[]} */
  const materials = [front, back]
    .map((url) => loader.load(url))
    .map((texture) => {
      texture.center.set(0.5, 0.5);
      texture.rotation = -Math.PI / 2;
      return new THREE.MeshLambertMaterial({
        map: texture,
      });
    });

  materials.unshift(
    new THREE.MeshStandardMaterial({
      color,
    })
  );

  const geometry = new THREE.CylinderGeometry(radius, radius, 5, 32);
  const mesh = new THREE.Mesh(geometry, materials);
  mesh.rotation.x = -Math.PI / 2;

  const innerRingRadius = 5;
  const outerRingRadius = 10;
  const ringGeometry = new THREE.RingGeometry(
    innerRingRadius,
    outerRingRadius,
    8
  );
  const ringMesh = new THREE.Mesh(
    ringGeometry,
    new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
    })
  );
  ringMesh.position.y = radius;

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3().setY(radius + innerRingRadius),
    new THREE.Vector3().setY(1000),
  ]);
  const lineMaterial = new THREE.LineBasicMaterial({
    color,
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);

  const group = new THREE.Group();
  group.add(mesh);
  group.add(line);
  group.add(ringMesh);

  group.position.copy(position);

  scene.add(group);
  ornaments.set(group, data);
}

function init() {
  const container = document.getElementById("container");

  camera = new THREE.PerspectiveCamera(
    20,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 1800;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0D1118);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  // shadow

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const loader = new THREE.CubeTextureLoader();
  const skyboxTexture = loader.load([
    'star_skybox.png',
    'star_skybox.png',
    'star_skybox.png',
    'star_skybox.png',
    'star_skybox.png',
    'star_skybox.png',
  ]);
  scene.background = skyboxTexture;

  ornament({
    front: "./img/image.png",
    back: "./img/image(1).png",
    radius: 70,
    rotate: 0.05,
    position: new THREE.Vector3(0, 0, 100),
  });
  ornament({
    front: "./img/image(2).png",
    back: "./img/image(3).png",
    position: new THREE.Vector3(250, 60, 0),
    portrait: new THREE.Vector3(150, 350, 0),
    rotate: 0.015,
  });
  ornament({
    front: "./img/image(10).png",
    back: "./img/image(6).png",
    position: new THREE.Vector3(-250, 100, 10),
    rotate: 0.02,
  });
  ornament({
    front: "./img/image(5).png",
    back: "./img/image(7).png",
    position: new THREE.Vector3(110, -150, -100),
    rotate: 0.025,
  });
  ornament({
    front: "./img/image(8).png",
    back: "./img/image(9).png",
    position: new THREE.Vector3(-170, -50, -100),
    radius: 70,
    rotate: 0.035
  });
  ornament({
    front: "./img/elfa_1.png",
    back: "./img/elfa_b.png",
    position: new THREE.Vector3(-350, -100, -50),
    portrait: new THREE.Vector3(-200, -400, -50),
    rotate: 0.1,
    radius: 100,
  });

  document.addEventListener("mousemove", onDocumentMouseMove);

  //

  window.addEventListener("resize", onWindowResize);

  onOrientationChange(portraitMedia);
  portraitMedia.addEventListener("change", onOrientationChange);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

/**
 * @param {{matches:boolean}} event
 */
function onOrientationChange({ matches: isPortrait }) {
  for (const [ornament, { position, portrait = position }] of ornaments) {
    ornament.position.copy(isPortrait ? portrait : position);
  }
  camera.position.z = isPortrait ? 4000 : 1800;
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;

  for (const [ornament, { rotate = 0.05 }] of ornaments) {
    ornament.rotation.y += rotate;
  }

  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}
