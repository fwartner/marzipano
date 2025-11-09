/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import eventEmitter from 'minimal-event-emitter';
import VideoAsset from '../assets/VideoAsset.js';

/**
 * @class VideoSource
 * @classdesc
 *
 * A Source that provides video textures from an HTMLVideoElement.
 * Supports equirect 360/180 and cubemap projections.
 *
 * @param {HTMLVideoElement} videoElement - The video element to use as source
 * @param {string} projection - Projection type: 'equirect360', 'equirect180', or 'cubemap'
 * @param {Object} opts - Options
 * @param {boolean} [opts.loop=false] - Whether to loop the video
 */
class VideoSource {
  constructor(videoElement, projection, opts) {
    opts = opts || {};

    this._videoElement = videoElement;
    this._projection = projection || 'equirect360';
    this._loop = opts.loop !== undefined ? opts.loop : false;

    // Validate projection type
    const validProjections = ['equirect360', 'equirect180', 'cubemap'];
    if (!validProjections.includes(this._projection)) {
      throw new Error(
        `Invalid projection: ${this._projection}. Must be one of: ${validProjections.join(', ')}`
      );
    }

    // Create the video asset
    this._asset = new VideoAsset(videoElement);

    // Set up video properties
    if (this._videoElement && this._loop) {
      this._videoElement.loop = true;
    }
  }

  /**
   * Load asset for a tile
   * @param {Stage} stage - The stage
   * @param {Tile} tile - The tile to load
   * @param {Function} done - Callback (err, tile, asset)
   * @return {Function} Cancel function
   */
  loadAsset(stage, tile, done) {
    // For video sources, we return the same asset for all tiles
    // The asset represents the entire video texture

    let cancelled = false;

    const checkReady = () => {
      if (cancelled) {
        return;
      }

      if (this._asset.isReady()) {
        // Video is ready to use
        done(null, tile, this._asset);
      } else {
        // Wait for video to be ready
        setTimeout(checkReady, 16); // Check every frame (~60fps)
      }
    };

    checkReady();

    // Return cancel function
    return () => {
      cancelled = true;
    };
  }

  /**
   * Get the projection type
   * @return {string}
   */
  projection() {
    return this._projection;
  }

  /**
   * Get the video element
   * @return {HTMLVideoElement}
   */
  videoElement() {
    return this._videoElement;
  }

  /**
   * Get the video asset
   * @return {VideoAsset}
   */
  asset() {
    return this._asset;
  }

  /**
   * Play the video
   * @return {Promise}
   */
  play() {
    if (this._videoElement) {
      return this._videoElement.play();
    }
    return Promise.reject(new Error('No video element'));
  }

  /**
   * Pause the video
   */
  pause() {
    if (this._videoElement) {
      this._videoElement.pause();
    }
  }

  /**
   * Seek to a specific time
   * @param {number} time - Time in seconds
   */
  seek(time) {
    if (this._videoElement) {
      this._videoElement.currentTime = time;
    }
  }

  /**
   * Get current playback time
   * @return {number}
   */
  currentTime() {
    return this._asset ? this._asset.getCurrentTime() : 0;
  }

  /**
   * Get video duration
   * @return {number}
   */
  duration() {
    return this._asset ? this._asset.getDuration() : 0;
  }

  /**
   * Check if video is playing
   * @return {boolean}
   */
  isPlaying() {
    return this._asset ? this._asset.isPlaying() : false;
  }

  /**
   * Check if video has ended
   * @return {boolean}
   */
  hasEnded() {
    return this._asset ? this._asset.hasEnded() : false;
  }

  /**
   * Destructor
   */
  destroy() {
    if (this._asset) {
      this._asset.destroy();
      this._asset = null;
    }
    this._videoElement = null;
  }
}

eventEmitter(VideoSource);

export default VideoSource;
