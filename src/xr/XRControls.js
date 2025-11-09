/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import eventEmitter from 'minimal-event-emitter';
import clearOwnProperties from '../util/clearOwnProperties.js';

/**
 * @class XRControls
 * @classdesc
 *
 * Handles WebXR controller input and mapping to application events.
 */
class XRControls {
  constructor(xrSession) {
    this._xrSession = xrSession;
    this._inputSources = new Map();

    // Track controller state
    this._selectStates = new Map();
    this._squeezeStates = new Map();
  }

  /**
   * Update controller state from XR frame
   * @param {XRFrame} _xrFrame
   */
  update(_xrFrame) {
    if (!this._xrSession) {
      return;
    }

    const inputSources = this._xrSession.inputSources;

    for (const inputSource of inputSources) {
      this._inputSources.set(inputSource, inputSource);

      // Track gamepad state if available
      if (inputSource.gamepad) {
        // Can track button states, axes, etc.
        this._updateGamepadState(inputSource.gamepad);
      }
    }
  }

  /**
   * Update gamepad state
   * @private
   * @param {Gamepad} _gamepad
   */
  _updateGamepadState(_gamepad) {
    // Track button states for future use
    // Currently we rely on select/squeeze events from XRSession
  }

  /**
   * Get all input sources
   * @return {XRInputSource[]}
   */
  getInputSources() {
    return Array.from(this._inputSources.values());
  }

  /**
   * Get primary input source (typically the right hand controller)
   * @return {XRInputSource|null}
   */
  getPrimaryInputSource() {
    const sources = this.getInputSources();

    // Prefer right hand, then left hand, then any available
    const right = sources.find((s) => s.handedness === 'right');
    if (right) return right;

    const left = sources.find((s) => s.handedness === 'left');
    if (left) return left;

    return sources[0] || null;
  }

  /**
   * Cleanup
   */
  destroy() {
    this._inputSources.clear();
    this._selectStates.clear();
    this._squeezeStates.clear();
    clearOwnProperties(this);
  }
}

eventEmitter(XRControls);

export default XRControls;
