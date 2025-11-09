/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import eventEmitter from 'minimal-event-emitter';
import clearOwnProperties from '../util/clearOwnProperties.js';

/**
 * @class VideoAsset
 * @classdesc
 *
 * A dynamic asset that wraps an HTMLVideoElement for use as a texture source.
 * Emits 'change' events when the video frame updates.
 *
 * @param {HTMLVideoElement} videoElement - The video element to wrap
 */
class VideoAsset {
  constructor(videoElement) {
    this._videoElement = videoElement;
    this._destroyed = false;
    this._emitChange = this.emit.bind(this, 'change');
    this._lastTimestamp = -1;

    // Empty canvas for when no video is present
    this._emptyCanvas = document.createElement('canvas');
    this._emptyCanvas.width = 1;
    this._emptyCanvas.height = 1;

    // Set up event listeners
    if (this._videoElement) {
      this._setupListeners();
    }
  }

  /**
   * Set up video event listeners
   * @private
   */
  _setupListeners() {
    // Listen for timeupdate events
    this._videoElement.addEventListener('timeupdate', this._emitChange);

    // Emit change event on every frame while video is playing
    const emitChangeIfPlaying = () => {
      if (!this._destroyed && this._videoElement && !this._videoElement.paused) {
        this.emit('change');
      }
      if (!this._destroyed) {
        this._rafHandle = requestAnimationFrame(emitChangeIfPlaying);
      }
    };

    this._rafHandle = requestAnimationFrame(emitChangeIfPlaying);
  }

  /**
   * Clean up event listeners
   * @private
   */
  _cleanupListeners() {
    if (this._videoElement) {
      this._videoElement.removeEventListener('timeupdate', this._emitChange);
    }
    if (this._rafHandle) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
  }

  /**
   * Set a new video element
   * @param {HTMLVideoElement} videoElement
   */
  setVideo(videoElement) {
    this._cleanupListeners();
    this._videoElement = videoElement;

    if (videoElement) {
      this._setupListeners();
    }

    this.emit('change');
  }

  /**
   * Get the video element
   * @return {HTMLVideoElement}
   */
  getVideo() {
    return this._videoElement;
  }

  /**
   * Get the width of the video
   * @return {number}
   */
  width() {
    if (this._videoElement && this._videoElement.videoWidth > 0) {
      return this._videoElement.videoWidth;
    }
    return this._emptyCanvas.width;
  }

  /**
   * Get the height of the video
   * @return {number}
   */
  height() {
    if (this._videoElement && this._videoElement.videoHeight > 0) {
      return this._videoElement.videoHeight;
    }
    return this._emptyCanvas.height;
  }

  /**
   * Get the element to use for rendering (video or empty canvas)
   * @return {HTMLVideoElement|HTMLCanvasElement}
   */
  element() {
    // Return empty canvas if no video or video not ready
    if (
      !this._videoElement ||
      this._videoElement.readyState < this._videoElement.HAVE_CURRENT_DATA
    ) {
      return this._emptyCanvas;
    }
    return this._videoElement;
  }

  /**
   * Whether this is a dynamic asset (always true for video)
   * @return {boolean}
   */
  isDynamic() {
    return true;
  }

  /**
   * Get the current timestamp of the video
   * @return {number}
   */
  timestamp() {
    if (this._videoElement) {
      this._lastTimestamp = this._videoElement.currentTime;
    }
    return this._lastTimestamp;
  }

  /**
   * Check if video is ready to be used as a texture
   * @return {boolean}
   */
  isReady() {
    return (
      this._videoElement && this._videoElement.readyState >= this._videoElement.HAVE_CURRENT_DATA
    );
  }

  /**
   * Get current playback time in seconds
   * @return {number}
   */
  getCurrentTime() {
    return this._videoElement ? this._videoElement.currentTime : 0;
  }

  /**
   * Get total duration in seconds
   * @return {number}
   */
  getDuration() {
    return this._videoElement ? this._videoElement.duration : 0;
  }

  /**
   * Check if video is playing
   * @return {boolean}
   */
  isPlaying() {
    return this._videoElement ? !this._videoElement.paused && !this._videoElement.ended : false;
  }

  /**
   * Check if video has ended
   * @return {boolean}
   */
  hasEnded() {
    return this._videoElement ? this._videoElement.ended : false;
  }

  /**
   * Destructor
   */
  destroy() {
    this._cleanupListeners();
    this._destroyed = true;
    clearOwnProperties(this);
  }
}

eventEmitter(VideoAsset);

export default VideoAsset;
