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
 * @param {[number, number, number, number]} startPos
 * @param {[number, number, number, number]} startVel
 */
function init(numPoints, startPos, startVel) {
  positions = new Float32Array(3 * numPoints);
  const velocities = new Float32Array(3 * numPoints);
  points = Array.from({ length: numPoints }, (_, i) => ({
    index: i,
    // `subarray()` creates a view onto the same memory
    position: positions.subarray(i * 3 + 0, i * 3 + 3),
    velocity: velocities.subarray(i * 3 + 0, i * 3 + 3),
    state: State.NOT_STARTED,
  }));
  lastFrame = performance.now();
  timePassed = 0

  const [xMin, xMax, yMin, yMax] = startPos;
  const [xSpeedMin, xSpeedMax, ySpeedMin, ySpeedMax] = startVel;
  for (var i = 0; i < numPoints; i++) {
    const point = points[i];

    point.position[X] = random(xMin, xMax);
    point.position[Y] = random(yMin, yMax);
    point.position[Z] = 0;

    point.velocity[X] = random(xSpeedMin, xSpeedMax);
    point.velocity[Y] = random(ySpeedMin, ySpeedMax);
    point.velocity[Z] = 0;
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
 * @param {[number, number]} roomSize
 * @param {number} delta
 */
function update(numPoints, roomSize, delta) {
  timePassed += delta;
  const rate = easingCurve(easeInSine, 10000, 50, timePassed) + 50;
  for (var i = 0; i < numPoints; i++) {
    const point = points[i];
    switch (point.state) {
      case State.NOT_STARTED:
        if (timePassed > (i * rate)) {
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
        point.velocity[Y] += 0.000098 * delta;
      case State.STOPPED:
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
    startVel = [0.1, 0.2, -0.1, -0.2],
  } = evt.data;
  clearInterval(intervalId);
  init(numPoints, startPos, startVel);

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
