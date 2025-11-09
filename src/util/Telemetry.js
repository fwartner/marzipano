/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @class Telemetry
 * @classdesc
 *
 * Collects performance telemetry data including FPS, dropped frames,
 * and GPU memory usage.
 */
class Telemetry {
  constructor() {
    // Frame timing
    this._frameTimes = [];
    this._maxFrameTimeSamples = 60; // Track last 60 frames
    this._lastFrameTime = null;
    this._droppedFrameCount = 0;
    this._droppedFrameThreshold = 33; // 33ms = 30fps threshold

    // FPS calculation
    this._fps = 0;
    this._fpsUpdateInterval = 500; // Update FPS every 500ms
    this._lastFpsUpdate = 0;
    this._framesSinceLastFpsUpdate = 0;

    // Performance samples
    this._lastSample = null;
  }

  /**
   * Record a frame timestamp
   * @param {number} timestamp - Current frame timestamp
   */
  recordFrame(timestamp) {
    if (this._lastFrameTime !== null) {
      const frameTime = timestamp - this._lastFrameTime;

      // Track frame times
      this._frameTimes.push(frameTime);
      if (this._frameTimes.length > this._maxFrameTimeSamples) {
        this._frameTimes.shift();
      }

      // Detect dropped frames
      if (frameTime > this._droppedFrameThreshold) {
        this._droppedFrameCount++;
      }

      // Update FPS calculation
      this._framesSinceLastFpsUpdate++;
      const timeSinceLastFpsUpdate = timestamp - this._lastFpsUpdate;

      if (timeSinceLastFpsUpdate >= this._fpsUpdateInterval) {
        this._fps = Math.round((this._framesSinceLastFpsUpdate / timeSinceLastFpsUpdate) * 1000);
        this._framesSinceLastFpsUpdate = 0;
        this._lastFpsUpdate = timestamp;
      }
    } else {
      this._lastFpsUpdate = timestamp;
    }

    this._lastFrameTime = timestamp;
  }

  /**
   * Get current FPS
   * @return {number}
   */
  getFPS() {
    return this._fps;
  }

  /**
   * Get dropped frame count
   * @return {number}
   */
  getDroppedFrames() {
    return this._droppedFrameCount;
  }

  /**
   * Reset dropped frame counter
   */
  resetDroppedFrames() {
    this._droppedFrameCount = 0;
  }

  /**
   * Get average frame time in milliseconds
   * @return {number}
   */
  getAverageFrameTime() {
    if (this._frameTimes.length === 0) {
      return 0;
    }
    const sum = this._frameTimes.reduce((a, b) => a + b, 0);
    return sum / this._frameTimes.length;
  }

  /**
   * Get current performance sample
   * @param {Object} additionalData - Additional data to include (gpuMB, tilesResident, etc.)
   * @return {Object}
   */
  getSample(additionalData = {}) {
    const sample = {
      fps: this._fps,
      droppedFrames: this._droppedFrameCount,
      avgFrameTime: this.getAverageFrameTime(),
      timestamp: Date.now(),
      ...additionalData,
    };

    this._lastSample = sample;
    return sample;
  }

  /**
   * Get last recorded sample
   * @return {Object|null}
   */
  getLastSample() {
    return this._lastSample;
  }

  /**
   * Reset all telemetry data
   */
  reset() {
    this._frameTimes = [];
    this._lastFrameTime = null;
    this._droppedFrameCount = 0;
    this._fps = 0;
    this._lastFpsUpdate = 0;
    this._framesSinceLastFpsUpdate = 0;
    this._lastSample = null;
  }
}

export default Telemetry;
