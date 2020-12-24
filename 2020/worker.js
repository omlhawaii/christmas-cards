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
/** @type {number} */
let coverOpacity;
/** @type {0 | 1} */
let phase;

/**
 * Return a random number between a and b.
 * @param {number} a
 * @param {number} b
 */
function random(a, b) {
  return Math.random() * (b - a) + a;
}

/**
 * @param {number} n
 * @param {number} min
 * @param {number} max
 */
function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
};

/**
 * @param {number} x
 * @returns {number} [0-1]
 */
function easeInSine(x) {
  return 1 - Math.cos((x * Math.PI) / 2);
}

/**
 * @param {number} x
 * @returns {number} [0-1]
 */
function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
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
  coverOpacity = 0;
  phase = 0;

  for (var i = 0; i < numPoints; i++) {
    const point = points[i];
    initPoint(point, i);
  }
}

/**
 * @param {(n: number) => number} curve
 * @param {number} width
 * @param {number} height
 * @param {number} n
 */
function easingCurve(curve, width, height, n) {
  const x = clamp(n / width, 0, 1);
  return curve(x) * height;
}

/**
 * @param {(n: number) => number} curve
 * @param {number} width
 * @param {number} height
 * @param {number} n
 */
function easingCurveInvert(curve, width, height, n) {
  const invert = 1 - easingCurve(curve, width, 1, n);
  return invert * height;
}

/**
 * @param {(n: number) => number} curve1
 * @param {(n: number) => number} curve2
 * @param {number} width
 * @param {number} height
 * @param {number} n
 */
function doubleEasing(curve1, curve2, width, height, n) {
  const x = clamp(n / width, 0, 2);
  if (x < 1) {
    console.log('a', curve1(x) * height)
    return curve1(x) * height;
  } else {
    const invert = 1 - curve2(x - 1);
    return invert * height;
  }
}

/**
 * @param {number} numPoints
 * @param {(point: Point, index: number) => void} initPoint
 * @param {[number, number]} roomSize
 * @param {number} delta
 */
function update(numPoints, initPoint, roomSize, delta) {
  let phaseSwitch = false;
  timePassed += delta;

  let rate;
  if (phase === 0) {
    rate = easingCurveInvert(easeInSine, 10000, 100, timePassed) + 0.5;
    coverOpacity = easingCurve(easeOutCubic, 2500, 1, timePassed - 10000);
    if (coverOpacity >= 1) {
      phase = 1;
      phaseSwitch = true;
    }
  } else {
    coverOpacity = easingCurveInvert(easeInSine, 2500, 1, timePassed - 12500);
  }

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
          point.position[Y] < -roomSize[Y]
        ) {
          point.state = State.STOPPED;
        }

        // Gravity
        point.velocity[X] += point.velocity[X] > 0 ? -0.0005 : 0.0005;
        point.velocity[Y] += -0.000098 * delta;
        break;
      case State.STOPPED:
        initPoint(point, index);
        point.recycleCount++;
        point.state = State.NOT_STARTED;
        break;
    }
  }

  return phaseSwitch;
}

let intervalId;

self.addEventListener("message", (evt) => {
  const {
    roomSize,
    numPoints,
    startPos = [0, 0],
  } = evt.data;
  clearInterval(intervalId);

  const [startX, startY] = startPos;
  /**
   * @param {Point} point
   * @param {number} index
   */
  function initPoint(point, index) {
    point.position[X] = random(startX - 0.1, startX + 0.1);
    point.position[Y] = random(startY - 0.1, startY + 0.1);
    point.position[Z] = 0;

    const offset = Math.sin(index / 10) / 4;
    point.velocity[X] = random(-0.1, 0.1) + offset;
    point.velocity[Y] = random(0.1, 0.9);
    point.velocity[Z] = 0;
  }

  init(numPoints, initPoint);

  /** @type {[number, number]} */
  const boundary = [roomSize[X] + 1, roomSize[Y] + 1];
  intervalId = setInterval(() => {
    const currentFrame = performance.now();
    const delta = currentFrame - lastFrame;
    lastFrame = currentFrame;

    const phaseSwitch = update(numPoints, initPoint, boundary, delta);

    // @ts-ignore
    self.postMessage({ positions, coverOpacity, phaseSwitch });
  }, 1000 / 60);
});
