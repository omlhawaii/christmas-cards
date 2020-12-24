// @ts-check
const [X, Y, Z] = [0, 1, 2];

const State = {
  NOT_STARTED: 0,
  LAUNCHED: 1,
  STOPPED: 2,
};

/**
 * @typedef {object} Point
 * @prop {number} index
 * @prop {Float32Array} position
 * @prop {Float32Array} velocity
 * @prop {State[keyof State]} state
 * @prop {number} recycleCount
 */

/** @type {Float32Array} */
let positions;
/** @type {Point[]} */
let points;
/** @type {number} */
let lastFrame;
/** @type {number} */
let timePassed;

/**
 * Return a random number between a and b.
 * @param {number} a
 * @param {number} b
 */
function random(a, b) {
  return Math.random() * (b - a) + a;
}

/**
 * @param {number} x
 * @returns {number} [0-1]
 */
function easeInSine(x) {
  return 1 - Math.cos((x * Math.PI) / 2);
}

/**
 * @param {number} numPoints
 * @param {(point: Point, index: number) => void} initPoint
 */
function init(numPoints, initPoint) {
  positions = new Float32Array(3 * numPoints);
  const velocities = new Float32Array(3 * numPoints);
  points = Array.from({ length: numPoints }, (_, i) => ({
    index: i,
    // `subarray()` creates a view onto the same memory
    position: positions.subarray(i * 3 + 0, i * 3 + 3),
    velocity: velocities.subarray(i * 3 + 0, i * 3 + 3),
    state: State.NOT_STARTED,
    recycleCount: 0,
  }));
  lastFrame = performance.now();
  timePassed = 0;

  for (var i = 0; i < numPoints; i++) {
    const point = points[i];
    initPoint(point, i);
  }
}

/**
 * @param {(n: number) => number} curve
 * @param {number} width
 * @param {number} height
 * @param {number} timePassed
 */
function easingCurve(curve, width, height, timePassed) {
  const x = Math.min(timePassed / width, 1);
  const invert = 1 - curve(x);
  return invert * height;
}

/**
 * @param {number} numPoints
 * @param {(point: Point, index: number) => void} initPoint
 * @param {[number, number]} roomSize
 * @param {number} delta
 */
function update(numPoints, initPoint, roomSize, delta) {
  timePassed += delta;
  const rate = easingCurve(easeInSine, 10000, 100, timePassed) + 0.5;
  for (var i = 0; i < numPoints; i++) {
    const point = points[i];
    const index = i + (point.recycleCount * numPoints);
    switch (point.state) {
      case State.NOT_STARTED:
        if (timePassed > index * rate) {
          point.state = State.LAUNCHED;
        }
        break;
      case State.LAUNCHED:
        point.position[X] += point.velocity[X] * delta;
        point.position[Y] += point.velocity[Y] * delta;

        if (
          point.position[X] < -roomSize[X] ||
          point.position[X] > roomSize[X] ||
          point.position[Y] < -roomSize[Y] ||
          point.position[Y] > roomSize[Y]
        ) {
          point.state = State.STOPPED;
        }

        // Gravity
        point.velocity[X] += point.velocity[X] > 0 ? -0.0005 : 0.0005;
        point.velocity[Y] += 0.000098 * delta;
        break;
      case State.STOPPED:
        initPoint(point, index);
        point.recycleCount++;
        point.state = State.NOT_STARTED;
        break;
    }
  }
}

let intervalId;

self.addEventListener("message", (evt) => {
  const {
    roomSize,
    numPoints,
    startPos = [0, 0, 0, 0],
  } = evt.data;
  clearInterval(intervalId);

  const [xMin, xMax, yMin, yMax] = startPos;
  /**
   * @param {Point} point
   * @param {number} index
   */
  function initPoint(point, index) {
    point.position[X] = random(xMin, xMax);
    point.position[Y] = random(yMin, yMax);
    point.position[Z] = 0;

    const offset = Math.sin(index / 10) / 4;
    point.velocity[X] = random(-0.1, 0.1) + offset;
    point.velocity[Y] = random(-0.1, -0.9);
    point.velocity[Z] = 0;
  }

  init(numPoints, initPoint);

  /** @type {[number, number]} */
  const boundary = [roomSize[X] + 1, roomSize[Y] + 1];
  intervalId = setInterval(() => {
    const currentFrame = performance.now();
    const delta = currentFrame - lastFrame;
    lastFrame = currentFrame;

    update(numPoints, initPoint, boundary, delta);

    // @ts-ignore
    self.postMessage(positions);
  }, 1000 / 60);
});
