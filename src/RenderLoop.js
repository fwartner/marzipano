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
import clearOwnProperties from './util/clearOwnProperties.js';
import Telemetry from './util/Telemetry.js';

/**
 * Signals that {@link Stage#render} is about to be called.
 * @event RenderLoop#beforeRender
 */

/**
 * Signals that {@link Stage#render} has just been called.
 * @event RenderLoop#afterRender
 */

/**
 * @class RenderLoop
 * @classdesc
 *
 * A RenderLoop wraps a {@link Stage} and calls {@link Stage#render} on the next
 * frame whenever it fires {@link Stage#renderInvalid}. It may be started and
 * stopped, and is initially in the stopped state, in which no call to
 * {@link Stage#render} occurs.
 *
 * @listens Stage#renderInvalid
 *
 * @param {Stage} stage
 */
class RenderLoop {
  constructor(stage) {
    // The stage wrapped by the loop.
    this._stage = stage;

    // Whether the loop is running.
    this._running = false;

    // Whether the loop is currently rendering.
    this._rendering = false;

    // The current requestAnimationFrame handle.
    this._requestHandle = null;

    // The callback passed into requestAnimationFrame.
    this._boundLoop = this._loop.bind(this);

    // Handler for renderInvalid events emitted by the stage.
    this._renderInvalidHandler = () => {
      // If we are already rendering, there's no need to schedule a new render
      // on the next frame.
      if (!this._rendering) {
        this.renderOnNextFrame();
      }
    };

    // Handle renderInvalid events emitted by the stage.
    this._stage.addEventListener('renderInvalid', this._renderInvalidHandler);

    // NEW M1.4: Telemetry tracking
    this._telemetry = new Telemetry();
    this._perfEmitInterval = 500; // Emit perf events every 500ms
    this._lastPerfEmit = 0;
  }

  /**
   * Destructor.
   */
  destroy() {
    this.stop();
    this._stage.removeEventListener('renderInvalid', this._renderInvalidHandler);
    clearOwnProperties(this);
  }

  /**
   * Returns the underlying stage.
   * @return {Stage}
   */
  stage() {
    return this._stage;
  }

  /**
   * Starts the render loop.
   */
  start() {
    this._running = true;
    this.renderOnNextFrame();
  }

  /**
   * Stops the render loop.
   */
  stop() {
    if (this._requestHandle) {
      window.cancelAnimationFrame(this._requestHandle);
      this._requestHandle = null;
    }
    this._running = false;
  }

  /**
   * Forces the stage to render on the next frame, even if its contents remain
   * valid. Does nothing if the loop is stopped.
   */
  renderOnNextFrame() {
    if (this._running && !this._requestHandle) {
      this._requestHandle = window.requestAnimationFrame(this._boundLoop);
    }
  }

  _loop(timestamp) {
    if (!this._running) {
      throw new Error('Render loop running while in stopped state');
    }

    // NEW M1.4: Record frame for telemetry
    if (timestamp) {
      this._telemetry.recordFrame(timestamp);
    }

    this._requestHandle = null;
    this._rendering = true;
    this.emit('beforeRender');
    this._rendering = false;
    this._stage.render();
    this.emit('afterRender');

    // NEW M1.4: Emit performance data periodically
    if (timestamp && timestamp - this._lastPerfEmit >= this._perfEmitInterval) {
      this._emitPerformanceData();
      this._lastPerfEmit = timestamp;
    }
  }

  /**
   * NEW M1.4: Emit performance data
   * @private
   */
  _emitPerformanceData() {
    const sample = this._telemetry.getSample();
    this.emit('performance', sample);
  }

  /**
   * NEW M1.4: Get telemetry instance
   * @return {Telemetry}
   */
  telemetry() {
    return this._telemetry;
  }

  /**
   * NEW M1.4: Get current FPS
   * @return {number}
   */
  getFPS() {
    return this._telemetry.getFPS();
  }

  /**
   * NEW M1.4: Get dropped frame count
   * @return {number}
   */
  getDroppedFrames() {
    return this._telemetry.getDroppedFrames();
  }
}

eventEmitter(RenderLoop);

export default RenderLoop;
