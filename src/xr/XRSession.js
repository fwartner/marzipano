/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import eventEmitter from 'minimal-event-emitter';
import clearOwnProperties from '../util/clearOwnProperties.js';

/**
 * @class XRSessionHandle
 * @classdesc
 *
 * Manages a WebXR immersive session, handling session lifecycle,
 * controller input, and pose updates.
 *
 * @param {XRSession} xrSession - The WebXR session
 * @param {RenderLoop} renderLoop - The render loop to integrate with
 * @param {View} view - The view to update with XR pose data
 */
class XRSessionHandle {
  constructor(xrSession, renderLoop, view) {
    this._xrSession = xrSession;
    this._renderLoop = renderLoop;
    this._view = view;
    this._active = true;
    this._referenceSpace = null;

    // XR frame request handle
    this._xrFrameHandle = null;

    // Bind XR frame loop
    this._boundXRLoop = this._xrLoop.bind(this);

    // Controller input handlers
    this._selectHandler = this._handleSelect.bind(this);
    this._squeezeHandler = this._handleSqueeze.bind(this);

    // Set up session event listeners
    this._xrSession.addEventListener('select', this._selectHandler);
    this._xrSession.addEventListener('squeeze', this._squeezeHandler);

    // Session end handler
    this._endHandler = () => {
      this._handleSessionEnd();
    };
    this._xrSession.addEventListener('end', this._endHandler);
  }

  /**
   * Initialize the XR session
   * @param {string} referenceSpaceType - Reference space type ('local', 'local-floor', etc.)
   * @return {Promise}
   */
  async init(referenceSpaceType = 'local-floor') {
    try {
      this._referenceSpace = await this._xrSession.requestReferenceSpace(referenceSpaceType);

      // Start XR render loop
      this._xrFrameHandle = this._xrSession.requestAnimationFrame(this._boundXRLoop);

      return this;
    } catch (err) {
      throw new Error(`Failed to initialize XR session: ${err.message}`);
    }
  }

  /**
   * XR frame loop
   * @private
   * @param {number} time - Frame time
   * @param {XRFrame} xrFrame - XR frame
   *
   * NEW M3.3: Video sources work automatically in XR mode through the
   * dynamic asset system. VideoAsset emits 'change' events that trigger
   * texture updates, which work seamlessly in both regular and XR render loops.
   */
  _xrLoop(time, xrFrame) {
    if (!this._active) {
      return;
    }

    // Request next frame
    this._xrFrameHandle = this._xrSession.requestAnimationFrame(this._boundXRLoop);

    // Get viewer pose
    const pose = xrFrame.getViewerPose(this._referenceSpace);
    if (!pose) {
      return; // Tracking lost
    }

    // Update view with pose data
    // XR handles camera automatically, but we update our view for consistency
    const transform = pose.transform;
    if (transform) {
      // Extract orientation from transform matrix
      // For now, we'll let the XR system handle the camera
      // and just trigger a render
    }

    // Trigger regular render loop (it will render to XR)
    // This ensures video textures are updated (M3.3)
    this._renderLoop.emit('beforeRender');
    this._renderLoop.emit('afterRender');
  }

  /**
   * Handle select controller input
   * @private
   * @param {XRInputSourceEvent} event
   */
  _handleSelect(event) {
    this.emit('select', event);
  }

  /**
   * Handle squeeze controller input
   * @private
   * @param {XRInputSourceEvent} event
   */
  _handleSqueeze(event) {
    this.emit('squeeze', event);
  }

  /**
   * Handle session end
   * @private
   */
  _handleSessionEnd() {
    if (!this._active) {
      return;
    }

    this._active = false;
    this.emit('end');
    this._cleanup();
  }

  /**
   * Get the XR session
   * @return {XRSession}
   */
  getSession() {
    return this._xrSession;
  }

  /**
   * Check if session is active
   * @return {boolean}
   */
  isActive() {
    return this._active;
  }

  /**
   * Get reference space
   * @return {XRReferenceSpace}
   */
  getReferenceSpace() {
    return this._referenceSpace;
  }

  /**
   * End the XR session
   * @return {Promise}
   */
  async end() {
    if (!this._active) {
      return;
    }

    this._active = false;

    if (this._xrSession) {
      await this._xrSession.end();
    }

    this._cleanup();
  }

  /**
   * Cleanup resources
   * @private
   */
  _cleanup() {
    if (this._xrSession) {
      this._xrSession.removeEventListener('select', this._selectHandler);
      this._xrSession.removeEventListener('squeeze', this._squeezeHandler);
      this._xrSession.removeEventListener('end', this._endHandler);
    }

    if (this._xrFrameHandle) {
      // Note: Can't cancel XR animation frame after session ends
      this._xrFrameHandle = null;
    }

    clearOwnProperties(this);
  }
}

eventEmitter(XRSessionHandle);

export default XRSessionHandle;
