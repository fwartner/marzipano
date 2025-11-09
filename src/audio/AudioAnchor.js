/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import eventEmitter from 'minimal-event-emitter';
import clearOwnProperties from '../util/clearOwnProperties.js';

/**
 * @class AudioAnchor
 * @classdesc
 *
 * A 3D audio anchor that positions audio sources in space based on
 * yaw/pitch coordinates. Updates panner node based on camera position.
 *
 * @param {AudioContext} context - The Web Audio API context
 * @param {Object} position - Initial position {yaw, pitch}
 * @param {Object} opts - Options
 * @param {string} [opts.distanceModel='inverse'] - Distance model: 'linear', 'inverse', or 'exponential'
 * @param {number} [opts.maxDistance=10000] - Maximum distance for attenuation
 * @param {number} [opts.refDistance=1] - Reference distance for attenuation
 * @param {number} [opts.rolloffFactor=1] - Rolloff factor
 * @param {number} [opts.coneInnerAngle=360] - Inner cone angle in degrees
 * @param {number} [opts.coneOuterAngle=360] - Outer cone angle in degrees
 * @param {number} [opts.coneOuterGain=0] - Gain outside the outer cone
 */
class AudioAnchor {
  constructor(context, position, opts) {
    opts = opts || {};

    this._context = context;
    this._position = {
      yaw: position.yaw || 0,
      pitch: position.pitch || 0,
    };

    // Create panner node for 3D positioning
    this._panner = context.createPanner();

    // Set panning model
    this._panner.panningModel = 'HRTF'; // Use HRTF for realistic 3D audio

    // Set distance model
    const distanceModel = opts.distanceModel || 'inverse';
    this._panner.distanceModel = distanceModel;
    this._panner.maxDistance = opts.maxDistance !== undefined ? opts.maxDistance : 10000;
    this._panner.refDistance = opts.refDistance !== undefined ? opts.refDistance : 1;
    this._panner.rolloffFactor = opts.rolloffFactor !== undefined ? opts.rolloffFactor : 1;

    // Set cone properties
    this._panner.coneInnerAngle = opts.coneInnerAngle !== undefined ? opts.coneInnerAngle : 360;
    this._panner.coneOuterAngle = opts.coneOuterAngle !== undefined ? opts.coneOuterAngle : 360;
    this._panner.coneOuterGain = opts.coneOuterGain !== undefined ? opts.coneOuterGain : 0;

    // Create gain node for volume control
    this._gainNode = context.createGain();
    this._gainNode.gain.value = 1.0;

    // Connect panner to gain node
    this._panner.connect(this._gainNode);

    // Connect gain node to destination
    this._gainNode.connect(context.destination);

    // Connected source nodes
    this._connectedSources = [];

    // Update initial position
    this._updatePosition();
  }

  /**
   * Convert yaw/pitch to 3D coordinates
   * @private
   * @return {Object} {x, y, z}
   */
  _yawPitchTo3D() {
    const yaw = this._position.yaw;
    const pitch = this._position.pitch;

    // Convert spherical coordinates to Cartesian
    const x = Math.cos(pitch) * Math.sin(yaw);
    const y = Math.sin(pitch);
    const z = -Math.cos(pitch) * Math.cos(yaw);

    return { x, y, z };
  }

  /**
   * Update panner position based on current yaw/pitch
   * @private
   */
  _updatePosition() {
    const pos = this._yawPitchTo3D();

    // Set position (where the sound is coming from)
    if (this._panner.positionX) {
      // Modern API (AudioParam)
      this._panner.positionX.value = pos.x;
      this._panner.positionY.value = pos.y;
      this._panner.positionZ.value = pos.z;
    } else {
      // Legacy API
      this._panner.setPosition(pos.x, pos.y, pos.z);
    }

    // Set orientation (direction the sound is pointing)
    if (this._panner.orientationX) {
      // Modern API (AudioParam)
      this._panner.orientationX.value = pos.x;
      this._panner.orientationY.value = pos.y;
      this._panner.orientationZ.value = pos.z;
    } else {
      // Legacy API
      this._panner.setOrientation(pos.x, pos.y, pos.z);
    }
  }

  /**
   * Set the position of the audio anchor
   * @param {number} yaw - Yaw in radians
   * @param {number} pitch - Pitch in radians
   */
  setPosition(yaw, pitch) {
    this._position.yaw = yaw;
    this._position.pitch = pitch;
    this._updatePosition();
  }

  /**
   * Get the current position
   * @return {Object} {yaw, pitch}
   */
  getPosition() {
    return {
      yaw: this._position.yaw,
      pitch: this._position.pitch,
    };
  }

  /**
   * Update listener (camera) position and orientation
   * @param {Object} viewParams - Current view parameters {yaw, pitch, roll}
   */
  updateListener(viewParams) {
    const listener = this._context.listener;

    // Calculate listener position (at origin)
    const listenerPos = { x: 0, y: 0, z: 0 };

    // Calculate listener forward direction based on view
    const yaw = viewParams.yaw || 0;
    const pitch = viewParams.pitch || 0;
    const roll = viewParams.roll || 0;

    const forward = {
      x: Math.cos(pitch) * Math.sin(yaw),
      y: Math.sin(pitch),
      z: -Math.cos(pitch) * Math.cos(yaw),
    };

    const up = {
      x: -Math.sin(pitch) * Math.sin(yaw),
      y: Math.cos(pitch),
      z: Math.sin(pitch) * Math.cos(yaw),
    };

    // Apply roll rotation to up vector
    const cosRoll = Math.cos(roll);
    const sinRoll = Math.sin(roll);
    const upRotated = {
      x: up.x * cosRoll - forward.x * sinRoll,
      y: up.y * cosRoll - forward.y * sinRoll,
      z: up.z * cosRoll - forward.z * sinRoll,
    };

    // Set listener position and orientation
    if (listener.positionX) {
      // Modern API (AudioParam)
      listener.positionX.value = listenerPos.x;
      listener.positionY.value = listenerPos.y;
      listener.positionZ.value = listenerPos.z;

      listener.forwardX.value = forward.x;
      listener.forwardY.value = forward.y;
      listener.forwardZ.value = forward.z;

      listener.upX.value = upRotated.x;
      listener.upY.value = upRotated.y;
      listener.upZ.value = upRotated.z;
    } else {
      // Legacy API
      listener.setPosition(listenerPos.x, listenerPos.y, listenerPos.z);
      listener.setOrientation(
        forward.x,
        forward.y,
        forward.z,
        upRotated.x,
        upRotated.y,
        upRotated.z
      );
    }
  }

  /**
   * Connect an audio source to this anchor
   * @param {AudioNode} sourceNode - The audio source node to connect
   */
  connect(sourceNode) {
    if (!sourceNode || !sourceNode.connect) {
      throw new Error('sourceNode must be an AudioNode with a connect method');
    }

    // Connect source to panner
    sourceNode.connect(this._panner);
    this._connectedSources.push(sourceNode);
  }

  /**
   * Disconnect an audio source from this anchor
   * @param {AudioNode} sourceNode - The audio source node to disconnect
   */
  disconnect(sourceNode) {
    const index = this._connectedSources.indexOf(sourceNode);
    if (index >= 0) {
      sourceNode.disconnect(this._panner);
      this._connectedSources.splice(index, 1);
    }
  }

  /**
   * Disconnect all audio sources
   */
  disconnectAll() {
    for (const source of this._connectedSources) {
      source.disconnect(this._panner);
    }
    this._connectedSources = [];
  }

  /**
   * Set the volume (gain)
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    this._gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get the current volume
   * @return {number}
   */
  getVolume() {
    return this._gainNode.gain.value;
  }

  /**
   * Fade volume to a target value
   * @param {number} targetVolume - Target volume (0.0 to 1.0)
   * @param {number} duration - Fade duration in seconds
   */
  fadeVolume(targetVolume, duration) {
    const currentTime = this._context.currentTime;
    this._gainNode.gain.cancelScheduledValues(currentTime);
    this._gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration);
  }

  /**
   * Get the panner node (for advanced control)
   * @return {PannerNode}
   */
  getPanner() {
    return this._panner;
  }

  /**
   * Get the gain node (for advanced control)
   * @return {GainNode}
   */
  getGainNode() {
    return this._gainNode;
  }

  /**
   * Destructor
   */
  destroy() {
    this.disconnectAll();

    if (this._gainNode) {
      this._gainNode.disconnect();
      this._gainNode = null;
    }

    if (this._panner) {
      this._panner.disconnect();
      this._panner = null;
    }

    clearOwnProperties(this);
  }
}

eventEmitter(AudioAnchor);

export default AudioAnchor;
