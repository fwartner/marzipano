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
import now from '../util/now.js';
import clearOwnProperties from '../util/clearOwnProperties.js';

/**
 * @class ControlComposer
 * @classdesc
 *
 * Combines changes in parameters triggered by multiple {@link ControlMethod}
 * instances.
 *
 * @listens ControlMethod#parameterDynamics
 */
function ControlComposer(opts) {
  opts = opts || {};

  this._methods = [];

  this._parameters = [ 'x' ,'y', 'axisScaledX', 'axisScaledY', 'zoom', 'yaw', 'pitch', 'roll' ];

  this._now = opts.nowForTesting || now;

  this._composedOffsets = { };

  this._composeReturn = { offsets: this._composedOffsets, changing: null };
}

eventEmitter(ControlComposer);

ControlComposer.prototype.add = function(instance) {
  if (this.has(instance)) {
    return;
  }

  let dynamics = {};
  this._parameters.forEach(function(parameter) {
    dynamics[parameter] = {
      dynamics: new Dynamics(),
      time: null
    };
  });

  const parameterDynamicsHandler = this._updateDynamics.bind(this, dynamics);

  let method = {
    instance: instance,
    dynamics: dynamics,
    parameterDynamicsHandler: parameterDynamicsHandler
  };

  instance.addEventListener('parameterDynamics', parameterDynamicsHandler);

  this._methods.push(method);
};

ControlComposer.prototype.remove = function(instance) {
  const index = this._indexOfInstance(instance);
  if (index >= 0) {
    const method = this._methods.splice(index, 1)[0];
    method.instance.removeEventListener('parameterDynamics', method.parameterDynamicsHandler);
  }
};

ControlComposer.prototype.has = function(instance) {
  return this._indexOfInstance(instance) >= 0;
};

ControlComposer.prototype._indexOfInstance = function(instance) {
  for (let i = 0; i < this._methods.length; i++) {
    if (this._methods[i].instance === instance) {
      return i;
    }
  }
  return -1;
};

ControlComposer.prototype.list = function() {
  let instances = [];
  for (let i = 0; i < this._methods.length; i++) {
    instances.push(this._methods[i].instance);
  }
  return instances;
};

ControlComposer.prototype._updateDynamics = function(storedDynamics, parameter, dynamics) {
  let parameterDynamics = storedDynamics[parameter];

  if (!parameterDynamics) {
    throw new Error("Unknown control parameter " + parameter);
  }

  const newTime = this._now();
  parameterDynamics.dynamics.update(dynamics, (newTime - parameterDynamics.time)/1000);
  parameterDynamics.time = newTime;

  this.emit('change');
};

ControlComposer.prototype._resetComposedOffsets = function() {
  for (let i = 0; i < this._parameters.length; i++) {
    this._composedOffsets[this._parameters[i]] = 0;
  }
};

ControlComposer.prototype.offsets = function() {
  var parameter;
  let changing = false;

  const currentTime = this._now();

  this._resetComposedOffsets();

  for (let i = 0; i < this._methods.length; i++) {
    const methodDynamics = this._methods[i].dynamics;

    for (const p = 0; p < this._parameters.length; p++) {
      parameter = this._parameters[p];
      const parameterDynamics = methodDynamics[parameter];
      const dynamics = parameterDynamics.dynamics;

      // Add offset to composed offset
      if (dynamics.offset != null) {
        this._composedOffsets[parameter] += dynamics.offset;
        // Reset offset
        dynamics.offset = null;
      }

      // Calculate offset from velocity and add it
      const elapsed = (currentTime - parameterDynamics.time)/1000;
      const offsetFromVelocity = dynamics.offsetFromVelocity(elapsed);

      if(offsetFromVelocity) {
        this._composedOffsets[parameter] += offsetFromVelocity;
      }

      // Update velocity on dynamics
      const currentVelocity = dynamics.velocityAfter(elapsed);
      dynamics.velocity = currentVelocity;

      // If there is still a velocity, set changing
      if(currentVelocity) {
        changing = true;
      }

      parameterDynamics.time = currentTime;
    }
  }

  this._composeReturn.changing = changing;
  return this._composeReturn;
};

ControlComposer.prototype.destroy = function() {
  const instances = this.list();
  for (const i = 0; i < instances.length; i++) {
    this.remove(instances[i]);
  }

  clearOwnProperties(this);
};

export default ControlComposer;
