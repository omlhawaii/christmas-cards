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
  const { front, back, radius = 100, color = 0x2e3c55 } = data;

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
  scene.background = new THREE.Color(0xffffff);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  // shadow

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop(0.1, "rgba(210,210,210,1)");
  gradient.addColorStop(1, "rgba(255,255,255,1)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const shadowTexture = new THREE.CanvasTexture(canvas);

  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture });
  const shadowGeo = new THREE.PlaneGeometry(300, 300, 10, 1);

  let shadowMesh;

  shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
  shadowMesh.position.y = -250;
  shadowMesh.rotation.x = -Math.PI / 2;
  //scene.add(shadowMesh);

  shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
  shadowMesh.position.y = -250;
  shadowMesh.position.x = -400;
  shadowMesh.rotation.x = -Math.PI / 2;
  //scene.add(shadowMesh);

  shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
  shadowMesh.position.y = -250;
  shadowMesh.position.x = 400;
  shadowMesh.rotation.x = -Math.PI / 2;
  //scene.add(shadowMesh);

  const radius = 200;

  const geometry1 = new THREE.IcosahedronGeometry(radius, 1);

  const count = geometry1.attributes.position.count;
  geometry1.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(count * 3), 3)
  );

  const geometry2 = geometry1.clone();
  const geometry3 = geometry1.clone();

  const color = new THREE.Color();
  const positions1 = geometry1.attributes.position;
  const positions2 = geometry2.attributes.position;
  const positions3 = geometry3.attributes.position;
  const colors1 = geometry1.attributes.color;
  const colors2 = geometry2.attributes.color;
  const colors3 = geometry3.attributes.color;

  for (let i = 0; i < count; i++) {
    color.setHSL((positions1.getY(i) / radius + 1) / 2, 1.0, 0.5);
    colors1.setXYZ(i, color.r, color.g, color.b);

    color.setHSL(0, (positions2.getY(i) / radius + 1) / 2, 0.5);
    colors2.setXYZ(i, color.r, color.g, color.b);

    color.setRGB(1, 0.8 - (positions3.getY(i) / radius + 1) / 2, 0);
    colors3.setXYZ(i, color.r, color.g, color.b);
  }

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

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
