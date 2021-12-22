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
 * @param {THREE.Vector3} [data.position] Position of the ornament
 */
function ornament(data) {
  const { front, back, radius = 100, color = 0xdcb869 } = data;

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

  const ringGeometry = new THREE.RingGeometry(5, 10, 8);
  const ringMesh = new THREE.Mesh(
    ringGeometry,
    new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
    })
  );
  ringMesh.position.y = radius;

  const group = new THREE.Group();
  group.add(mesh);
  group.add(ringMesh);

  if (data.position) {
    group.position.copy(data.position);
  }

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
  scene.background = new THREE.Color(0x2e3c55);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  // shadow

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  /*const loader = new THREE.TextureLoader();
  const planeGeometry = new THREE.PlaneGeometry(3000, 3000);
  const plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({
    map: loader.load('./img/tree.jpg')
  }))
  plane.position.z = -200;
  scene.add(plane);*/

  ornament({
    front: "./img/image.png",
    back: "./img/image(1).png",
    radius: 70,
    rotate: 0.1,
  });
  ornament({
    front: "./img/image(2).png",
    back: "./img/image(3).png",
    position: new THREE.Vector3(250, 10, 0),
    rotate: 0.06,
    color: 0xdcb869,
  });
  ornament({
    front: "./img/image(4).png",
    back: "./img/image(5).png",
    position: new THREE.Vector3(-250, 20, 0)
  });

  document.addEventListener("mousemove", onDocumentMouseMove);

  //

  window.addEventListener("resize", onWindowResize);
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
