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


import eventEmitter from 'minimal-event-emitter';
import Dynamics from './Dynamics.js';
import defaults from '../util/defaults.js';
import clearOwnProperties from '../util/clearOwnProperties.js';

const defaultOptions = {
  frictionTime: 0.2,
  zoomDelta: 0.001
};

/**
 * @class ScrollZoomControlMethod
 * @implements ControlMethod
 * @classdesc
 *
 * Controls the fov/zoom through the mouse wheel.
 *
 * @param {Element} element Element to listen for events.
 * @param {Object} opts
 * @param {number} [opts.frictionTime=0.2]
 * @param {number} [opts.zoomDelta=0.001]
 */
function ScrollZoomControlMethod(element, opts) {
  this._element = element;
  this._opts = defaults(opts || {}, defaultOptions);
  this._dynamics = new Dynamics();
  this._eventList = [];

  const fn = this._opts.frictionTime ? this.withSmoothing : this.withoutSmoothing;
  this._wheelListener = fn.bind(this);
  
  element.addEventListener('wheel', this._wheelListener);
}

eventEmitter(ScrollZoomControlMethod);

/**
 * Destructor.
 */
ScrollZoomControlMethod.prototype.destroy = function() {
  this._element.removeEventListener('wheel', this._wheelListener);
  clearOwnProperties(this);
};

ScrollZoomControlMethod.prototype.withoutSmoothing = function(e) {
  this._dynamics.offset = wheelEventDelta(e) * this._opts.zoomDelta;
  this.emit('parameterDynamics', 'zoom', this._dynamics);

  e.preventDefault();

  this.emit('active');
  this.emit('inactive');
};

ScrollZoomControlMethod.prototype.withSmoothing = function(e) {
  const currentTime = e.timeStamp;

  // Record event.
  this._eventList.push(e);

  // Remove events whose smoothing has already expired.
  while (this._eventList[0].timeStamp < currentTime - this._opts.frictionTime*1000) {
    this._eventList.shift(0);
  }

  // Get the current velocity from the recorded events.
  // Each wheel movement causes a velocity of change/frictionTime during frictionTime.
  let velocity = 0;
  for (const i = 0; i < this._eventList.length; i++) {
    const zoomChangeFromEvent = wheelEventDelta(this._eventList[i]) * this._opts.zoomDelta;
    velocity += zoomChangeFromEvent / this._opts.frictionTime;
  }

  this._dynamics.velocity = velocity;
  this._dynamics.friction = Math.abs(velocity) / this._opts.frictionTime;

  this.emit('parameterDynamics', 'zoom', this._dynamics);

  e.preventDefault();

  this.emit('active');
  this.emit('inactive');
};

function wheelEventDelta(e) {
  const multiplier = e.deltaMode == 1 ? 20 : 1;
  return e.deltaY * multiplier;
}

export default ScrollZoomControlMethod;
