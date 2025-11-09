/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import Stage from './Stage.js';
import { setAbsolute, setFullSize } from '../util/dom.js';

/**
 * @class WebGpuStage
 * @extends Stage
 * @classdesc
 *
 * NEW M4.2: EXPERIMENTAL WebGPU implementation of Stage.
 * This is an experimental backend and requires WebGPU support.
 *
 * @param {Object} opts
 * @param {boolean} [opts.experimental=false] - Must be true to enable
 */
class WebGpuStage extends Stage {
  constructor(opts) {
    opts = opts || {};

    if (!opts.experimental) {
      throw new Error('WebGPU stage requires experimental: true option');
    }

    super(opts);

    this._domElement = document.createElement('canvas');
    setAbsolute(this._domElement);
    setFullSize(this._domElement);

    // WebGPU state
    this._adapter = null;
    this._device = null;
    this._context = null;
    this._renderPipeline = null;
    this._initialized = false;
  }

  /**
   * Initialize WebGPU
   * @return {Promise}
   */
  async init() {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      throw new Error('WebGPU is not supported in this browser');
    }

    try {
      // Request adapter
      this._adapter = await navigator.gpu.requestAdapter();
      if (!this._adapter) {
        throw new Error('No WebGPU adapter available');
      }

      // Request device
      this._device = await this._adapter.requestDevice();

      // Configure context
      this._context = this._domElement.getContext('webgpu');
      const preferredFormat = navigator.gpu.getPreferredCanvasFormat();

      this._context.configure({
        device: this._device,
        format: preferredFormat,
        alphaMode: 'premultiplied',
      });

      this._initialized = true;
      return this;
    } catch (err) {
      throw new Error(`Failed to initialize WebGPU: ${err.message}`);
    }
  }

  /**
   * Destructor
   */
  destroy() {
    if (this._device) {
      this._device.destroy();
      this._device = null;
    }
    super.destroy();
  }

  /**
   * Returns the underlying DOM element
   * @return {HTMLCanvasElement}
   */
  domElement() {
    return this._domElement;
  }

  /**
   * Get WebGPU device
   * @return {GPUDevice|null}
   */
  device() {
    return this._device;
  }

  /**
   * Get WebGPU context
   * @return {GPUCanvasContext|null}
   */
  gpuContext() {
    return this._context;
  }

  /**
   * Check if initialized
   * @return {boolean}
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Get backend type
   * @return {string}
   */
  type() {
    return 'webgpu';
  }

  /**
   * Validate layer (implement Stage interface)
   * @param {Layer} _layer
   */
  validateLayer(_layer) {
    // For now, accept all layers
    // Full implementation would validate geometry/view compatibility
    return true;
  }

  /**
   * Set size for WebGPU (implement Stage interface)
   */
  setSizeForType() {
    const width = this._width;
    const height = this._height;

    this._domElement.width = width;
    this._domElement.height = height;
  }

  /**
   * Load image (implement Stage interface)
   * @param {string} url
   * @param {Object} rect
   * @param {Function} done
   * @return {Function} Cancel function
   */
  loadImage(url, rect, done) {
    // Use browser's built-in image loading
    const image = new Image();
    let cancelled = false;

    image.onload = () => {
      if (!cancelled) {
        // Create a simple asset wrapper
        const asset = {
          element: () => image,
          width: () => image.width,
          height: () => image.height,
          isDynamic: () => false,
          destroy: () => {},
        };
        done(null, asset);
      }
    };

    image.onerror = () => {
      if (!cancelled) {
        done(new Error(`Failed to load image: ${url}`));
      }
    };

    image.crossOrigin = 'anonymous';
    image.src = url;

    return () => {
      cancelled = true;
    };
  }

  /**
   * Start frame (implement Stage interface)
   */
  startFrame() {
    if (!this._initialized) {
      return;
    }
    // WebGPU frame setup
  }

  /**
   * End frame (implement Stage interface)
   */
  endFrame() {
    if (!this._initialized) {
      return;
    }
    // WebGPU frame finalization
  }

  /**
   * Create renderer (implement Stage interface)
   * @param {*} rendererClass
   * @return {*}
   */
  createRenderer(rendererClass) {
    // Return placeholder for WebGPU renderers
    return new rendererClass(this);
  }

  /**
   * Destroy renderer (implement Stage interface)
   * @param {*} renderer
   */
  destroyRenderer(renderer) {
    if (renderer && renderer.destroy) {
      renderer.destroy();
    }
  }
}

// Export Stage type constant
WebGpuStage.prototype.type = 'webgpu';

export default WebGpuStage;
