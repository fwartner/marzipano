/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import now from './now.js';

/**
 * @function tween
 * @desc Time-based tween utility with frame-rate independent timing
 *
 * Supports two API signatures:
 * 1. Legacy: tween(duration, update, done)
 * 2. Enhanced: tween(value, to, {duration, easing, onUpdate, onComplete})
 *
 * @param {number|*} durationOrValue - Either duration (legacy) or starting value (enhanced)
 * @param {Function|*} updateOrTo - Either update callback (legacy) or target value (enhanced)
 * @param {Function|Object} [doneOrOpts] - Either done callback (legacy) or options object (enhanced)
 * @returns {Function} Cancel function
 */
function tween(durationOrValue, updateOrTo, doneOrOpts) {
  // Detect API signature
  const isEnhancedAPI = typeof doneOrOpts === 'object' && doneOrOpts !== null;

  if (isEnhancedAPI) {
    // Enhanced API: tween(value, to, {duration, easing, onUpdate, onComplete})
    return enhancedTween(durationOrValue, updateOrTo, doneOrOpts);
  } else {
    // Legacy API: tween(duration, update, done)
    return legacyTween(durationOrValue, updateOrTo, doneOrOpts);
  }
}

/**
 * Legacy tween implementation (maintains backward compatibility)
 */
function legacyTween(duration, update, done) {
  let cancelled = false;

  const startTime = now();

  function runUpdate() {
    if (cancelled) {
      return;
    }
    const tweenVal = (now() - startTime) / duration;
    if (tweenVal < 1) {
      update(tweenVal);
      requestAnimationFrame(runUpdate);
    } else {
      update(1);
      done();
    }
  }

  update(0);
  requestAnimationFrame(runUpdate);

  return function cancel() {
    cancelled = true;
    done.apply(null, arguments);
  };
}

/**
 * Enhanced tween implementation with easing and value interpolation
 */
function enhancedTween(value, to, opts) {
  const duration = opts.duration;
  const easing = opts.easing || ((t) => t); // linear by default
  const onUpdate = opts.onUpdate;
  const onComplete = opts.onComplete;

  let cancelled = false;
  const startTime = now();

  // Support for both number and object values
  const isObject = typeof value === 'object' && value !== null;

  function interpolate(t) {
    const easedT = easing(t);

    if (isObject) {
      const result = {};
      for (const key in value) {
        if (typeof value[key] === 'number' && typeof to[key] === 'number') {
          result[key] = value[key] + (to[key] - value[key]) * easedT;
        } else {
          result[key] = t < 0.5 ? value[key] : to[key];
        }
      }
      return result;
    } else {
      return value + (to - value) * easedT;
    }
  }

  function runUpdate() {
    if (cancelled) {
      return;
    }

    const elapsed = now() - startTime;
    const t = Math.min(elapsed / duration, 1);

    const currentValue = interpolate(t);
    onUpdate(currentValue);

    if (t < 1) {
      requestAnimationFrame(runUpdate);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  }

  // Initial update
  onUpdate(interpolate(0));
  requestAnimationFrame(runUpdate);

  return function cancel() {
    cancelled = true;
    if (onComplete) {
      onComplete();
    }
  };
}

export default tween;
