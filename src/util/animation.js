/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @module animation
 * @desc Easing functions and animation utilities for time-based interpolation.
 */

/**
 * Linear easing function (no easing, constant rate)
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function linear(t) {
  return t;
}

/**
 * Quadratic ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Quadratic ease in
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInQuad(t) {
  return t * t;
}

/**
 * Quadratic ease out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Cubic ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Cubic ease in
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInCubic(t) {
  return t * t * t;
}

/**
 * Cubic ease out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Quartic ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

/**
 * Quintic ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/**
 * Sine ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Exponential ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutExpo(t) {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

/**
 * Circular ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutCirc(t) {
  return t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
}

/**
 * Elastic ease out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;

  if (t === 0) return 0;
  if (t === 1) return 1;

  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Elastic ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutElastic(t) {
  const c5 = (2 * Math.PI) / 4.5;

  if (t === 0) return 0;
  if (t === 1) return 1;

  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
}

/**
 * Bounce ease out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

/**
 * Bounce ease in/out
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutBounce(t) {
  return t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2;
}

/**
 * Back ease in/out (overshoots then returns)
 * @param {number} t - Time value between 0 and 1
 * @returns {number} Eased value between 0 and 1
 */
export function easeInOutBack(t) {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;

  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

/**
 * Interpolate between two values
 * @param {number} from - Starting value
 * @param {number} to - Ending value
 * @param {number} t - Time value between 0 and 1
 * @param {Function} [easing=linear] - Easing function
 * @returns {number} Interpolated value
 */
export function interpolate(from, to, t, easing = linear) {
  const easedT = easing(t);
  return from + (to - from) * easedT;
}

/**
 * Interpolate between two angles (shortest path)
 * @param {number} from - Starting angle in radians
 * @param {number} to - Ending angle in radians
 * @param {number} t - Time value between 0 and 1
 * @param {Function} [easing=linear] - Easing function
 * @returns {number} Interpolated angle in radians
 */
export function interpolateAngle(from, to, t, easing = linear) {
  // Normalize angles to [-π, π]
  const normalizeAngle = (angle) => {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  };

  from = normalizeAngle(from);
  to = normalizeAngle(to);

  // Calculate shortest distance
  let diff = to - from;
  if (diff > Math.PI) {
    diff -= 2 * Math.PI;
  } else if (diff < -Math.PI) {
    diff += 2 * Math.PI;
  }

  const easedT = easing(t);
  return normalizeAngle(from + diff * easedT);
}

/**
 * Create a time-based animation function
 * @param {Object} opts - Animation options
 * @param {number} opts.duration - Duration in milliseconds
 * @param {Function} [opts.easing=linear] - Easing function
 * @param {Function} opts.onUpdate - Called each frame with (progress)
 * @param {Function} [opts.onComplete] - Called when animation completes
 * @returns {Function} Cancel function
 */
export function animate(opts) {
  const duration = opts.duration;
  const easing = opts.easing || linear;
  const onUpdate = opts.onUpdate;
  const onComplete = opts.onComplete;

  let cancelled = false;
  let rafId = null;

  const startTime = performance.now();

  function step(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    onUpdate(easedProgress);

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  }

  rafId = requestAnimationFrame(step);

  // Return cancel function
  return function cancel() {
    cancelled = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (onComplete) {
      onComplete();
    }
  };
}

export default {
  linear,
  easeInOutQuad,
  easeInQuad,
  easeOutQuad,
  easeInOutCubic,
  easeInCubic,
  easeOutCubic,
  easeInOutQuart,
  easeInOutQuint,
  easeInOutSine,
  easeInOutExpo,
  easeInOutCirc,
  easeOutElastic,
  easeInOutElastic,
  easeOutBounce,
  easeInOutBounce,
  easeInOutBack,
  interpolate,
  interpolateAngle,
  animate,
};
