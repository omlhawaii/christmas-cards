// @ts-check
const [X, Y, Z] = [0, 1, 2];

/** @type {Float32Array} */
let positions;
/** @type {{ index: number, position: Float32Array, velocity: Float32Array, hidden: boolean }[]} */
let points;
/** @type {number} */
let lastFrame;

/**
 * Return a random number between a and b.
 * @param {number} a
 * @param {number} b
 */
function random(a, b) {
  return Math.random() * (b - a) + a;
}

/**
 * @param {number} numPoints
 * @param {[number, number]} roomSize
 */
function init(numPoints, roomSize) {
  positions = new Float32Array(3 * numPoints);
  const velocities = new Float32Array(3 * numPoints);
  points = Array.from({ length: numPoints }, (_, i) => ({
    index: i,
    // `subarray()` creates a view onto the same memory
    position: positions.subarray(i * 3 + 0, i * 3 + 3),
    velocity: velocities.subarray(i * 3 + 0, i * 3 + 3),
    hidden: false,
  }));
  lastFrame = performance.now();

  for (var i = 0; i < numPoints; i++) {
    const point = points[i];

    point.position[X] = random(0, 0);
    point.position[Y] = random(0, 0);
    point.position[Z] = 0;

    point.velocity[X] = random(0.1, 0.2);
    point.velocity[Y] = random(-0.1, -0.2);
    point.velocity[Z] = 0;
  }
}

/**
 * @param {number} numPoints
 * @param {[number, number]} roomSize
 * @param {number} delta
 */
function update(numPoints, roomSize, delta) {
  for (var i = 0; i < numPoints; i++) {
    const point = points[i];
    if (point.hidden) continue;

    point.position[X] += point.velocity[X] * delta;
    point.position[Y] += point.velocity[Y] * delta;

    if (
      point.position[X] < -roomSize[X] ||
      point.position[X] > roomSize[X] ||
      point.position[Y] < -roomSize[Y] ||
      point.position[Y] > roomSize[Y]
    ) {
      point.hidden = true;
    }

    // Gravity
    point.velocity[Y] += 0.000098 * delta;
  }
}

let intervalId;

self.addEventListener("message", (evt) => {
  const { roomSize, numPoints } = evt.data;
  clearInterval(intervalId);
  init(numPoints, roomSize);

  /** @type {[number, number]} */
  const boundary = [roomSize[X] + 1, roomSize[Y] + 1];
  intervalId = setInterval(() => {
    const currentFrame = performance.now();
    const delta = currentFrame - lastFrame;
    lastFrame = currentFrame;

    update(numPoints, boundary, delta);

    // @ts-ignore
    self.postMessage(positions);
  }, 1000 / 60);
});
