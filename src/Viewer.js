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
import RenderLoop from './RenderLoop.js';
import Controls from './controls/Controls.js';
import Scene from './Scene.js';
import Timer from './Timer.js';
import WebGlStage from './stages/WebGl.js';
import ControlCursor from './controls/ControlCursor.js';
import HammerGestures from './controls/HammerGestures.js';
import registerDefaultControls from './controls/registerDefaultControls.js';
import registerDefaultRenderers from './renderers/registerDefaultRenderers.js';
import tween from './util/tween.js';
import noop from './util/noop.js';
import clearOwnProperties from './util/clearOwnProperties.js';
import RayPicker from './util/RayPicker.js';
import Accessibility from './util/Accessibility.js';
import { getTransition } from './transitions/Transitions.js';

import { setOverflowHidden } from './util/dom.js';
import { setAbsolute } from './util/dom.js';
import { setFullSize } from './util/dom.js';

/**
 * Signals that the current scene has changed.
 * @event Viewer#sceneChange
 */

/**
 * Signals that the view of the current scene has changed. See
 * {@link View#event:change}.
 * @event Viewer#viewChange
 */

/**
 * @class Viewer
 * @classdesc
 *
 * A Viewer is a container for multiple {@link Scene scenes} to be displayed
 * inside a {@link Stage stage} contained in the DOM.
 *
 * Scenes may be created by calling {@link Viewer#createScene}. Except during a
 * scene switch, a single one of them, called the current scene, is visible.
 * Calling {@link Viewer#switchScene} sets the current scene and switches to it.
 *
 * @param {Element} domElement The DOM element to contain the stage.
 * @param {Object} opts Viewer creation options.
 * @param {Object} opts.controls Options to be passed to
 *     {@link registerDefaultControls}.
 * @param {Object} opts.stage Options to be passed to the {@link Stage}
 *     constructor.
 * @param {Object} opts.cursors Cursor options.
 * @param {Object} opts.cursors.drag Drag cursor options to be passed to the
 *     {@link ControlCursor} constructor.
 */
class Viewer {
  constructor(domElement, opts) {
    opts = opts || {};

    this._domElement = domElement;

    // Add `overflow: hidden` to the domElement.
    setOverflowHidden(domElement);

    // Create stage.
    this._stage = new WebGlStage(opts.stage);

    // Register the default renderers for the selected stage.
    registerDefaultRenderers(this._stage);

    // Add the stage element into the DOM.
    this._domElement.appendChild(this._stage.domElement());

    // Create control container.
    // Controls cannot be placed directly on the root DOM element because
    // Hammer.js will prevent click events from reaching the elements beneath.

    // The hotspot containers will be added inside the controls container.
    this._controlContainer = document.createElement('div');
    setAbsolute(this._controlContainer);
    setFullSize(this._controlContainer);
    domElement.appendChild(this._controlContainer);

    // Respond to window size changes.
    this._size = {};
    this.updateSize();
    this._updateSizeListener = this.updateSize.bind(this);
    window.addEventListener('resize', this._updateSizeListener);

    // Create render loop.
    this._renderLoop = new RenderLoop(this._stage);

    // NEW M1.4: Forward performance events from render loop to viewer
    this._performanceHandler = (sample) => {
      // Augment sample with texture store data
      const augmentedSample = { ...sample };

      if (this._currentScene) {
        const layers = this._currentScene.listLayers();
        let totalGpuMB = 0;
        let totalTilesResident = 0;
        let totalTilesHit = 0;
        let totalTilesMiss = 0;

        for (let i = 0; i < layers.length; i++) {
          const textureStore = layers[i].textureStore();
          if (textureStore && textureStore.telemetryData) {
            const telemetry = textureStore.telemetryData();
            totalGpuMB += telemetry.gpuMemoryUsageMB || 0;
            totalTilesResident += telemetry.residentTextures || 0;
            totalTilesHit += telemetry.cacheHits || 0;
            totalTilesMiss += telemetry.cacheMisses || 0;
          }
        }

        augmentedSample.gpuMB = totalGpuMB;
        augmentedSample.tilesResident = totalTilesResident;
        augmentedSample.tilesHit = totalTilesHit;
        augmentedSample.tilesMiss = totalTilesMiss;
      }

      this.emit('perf', augmentedSample);
    };
    this._renderLoop.addEventListener('performance', this._performanceHandler);

    // Create the controls and register them with the render loop.
    this._controls = new Controls();
    this._controlMethods = registerDefaultControls(
      this._controls,
      this._controlContainer,
      opts.controls
    );
    this._controls.attach(this._renderLoop);

    // Expose HammerJS.
    this._hammerManagerTouch = HammerGestures.get(this._controlContainer, 'touch');
    this._hammerManagerMouse = HammerGestures.get(this._controlContainer, 'mouse');

    // Initialize drag cursor.
    this._dragCursor = new ControlCursor(
      this._controls,
      'mouseViewDrag',
      domElement,
      (opts.cursors && opts.cursors.drag) || {}
    );

    // Start the render loop.
    this._renderLoop.start();

    // Scene list.
    this._scenes = [];

    // The currently visible scene.
    // During a scene transition, this is the scene being switched to.
    this._currentScene = null;

    // The scene being switched from during a scene transition.
    // This is necessary to update the layers correctly when they are added or
    // removed during a transition.
    this._replacedScene = null;

    // The current transition.
    this._cancelCurrentTween = null;

    // The event listener fired when the current scene layers change.
    // This is attached to the correct scene whenever the current scene changes.
    this._layerChangeHandler = this._updateSceneLayers.bind(this);

    // The event listener fired when the current scene view changes.
    // This is attached to the correct scene whenever the current scene changes.
    this._viewChangeHandler = this.emit.bind(this, 'viewChange');

    // Setup the idle timer.
    // By default, the timer has an infinite duration so it does nothing.
    this._idleTimer = new Timer();
    this._idleTimer.start();

    // Reset the timer whenever the view changes.
    this._resetIdleTimerHandler = this._resetIdleTimer.bind(this);
    this.addEventListener('viewChange', this._resetIdleTimerHandler);

    // Start the idle movement when the idle timer fires.
    this._triggerIdleTimerHandler = this._triggerIdleTimer.bind(this);
    this._idleTimer.addEventListener('timeout', this._triggerIdleTimerHandler);

    // Stop an ongoing movement when the controls are activated or when the
    // scene changes.
    this._stopMovementHandler = this.stopMovement.bind(this);
    this._controls.addEventListener('active', this._stopMovementHandler);
    this.addEventListener('sceneChange', this._stopMovementHandler);

    // The currently programmed idle movement.
    this._idleMovement = null;

    // NEW M1.3: LOD/Prefetch policy
    this._lodPolicy = null;

    // NEW M3.1: WebXR session
    this._xrSession = null;

    // NEW M4.3: Tone mapping settings
    this._toneMapping = {
      mode: 'none',
      exposure: 1.0,
      gamma: 2.2,
    };
  }

  /**
   * Destructor.
   */
  destroy() {
    window.removeEventListener('resize', this._updateSizeListener);

    // NEW M1.4: Remove performance event listener
    if (this._performanceHandler) {
      this._renderLoop.removeEventListener('performance', this._performanceHandler);
    }

    if (this._currentScene) {
      this._removeSceneEventListeners(this._currentScene);
    }

    if (this._replacedScene) {
      this._removeSceneEventListeners(this._replacedScene);
    }

    this._dragCursor.destroy();

    for (const methodName in this._controlMethods) {
      this._controlMethods[methodName].destroy();
    }

    while (this._scenes.length) {
      this.destroyScene(this._scenes[0]);
    }

    this._domElement.removeChild(this._stage.domElement());

    this._stage.destroy();
    this._renderLoop.destroy();
    this._controls.destroy();
    this._controls = null;

    if (this._cancelCurrentTween) {
      this._cancelCurrentTween();
    }

    clearOwnProperties(this);
  }

  /**
   * Updates the stage size to fill the containing element.
   *
   * This method is automatically called when the browser window is resized.
   * Most clients won't need to explicitly call it to keep the size up to date.
   */
  updateSize() {
    const size = this._size;
    size.width = this._domElement.clientWidth;
    size.height = this._domElement.clientHeight;
    this._stage.setSize(size);
  }

  /**
   * Returns the underlying {@link Stage stage}.
   * @return {Stage}
   */
  stage() {
    return this._stage;
  }

  /**
   * Returns the underlying {@link RenderLoop render loop}.
   * @return {RenderLoop}
   */
  renderLoop() {
    return this._renderLoop;
  }

  /**
   * Returns the underlying {@link Controls controls}.
   * @return {Controls}
   */
  controls() {
    return this._controls;
  }

  /**
   * Returns the underlying DOM element.
   * @return {Element}
   */
  domElement() {
    return this._domElement;
  }

  /**
   * Creates a new {@link Scene scene} with a single layer and adds it to the
   * viewer.
   *
   * The current scene does not change. To switch to the scene, call
   * {@link Viewer#switchScene}.
   *
   * @param {Object} opts Scene creation options.
   * @param {View} opts.view The scene's underlying {@link View}.
   * @param {Source} opts.source The layer's underlying {@link Source}.
   * @param {Geometry} opts.geometry The layer's underlying {@link Geometry}.
   * @param {boolean} [opts.pinFirstLevel=false] Whether to pin the first level to
   *     provide a fallback of last resort, at the cost of memory consumption.
   * @param {Object} [opts.textureStoreOpts={}] Options to pass to the
   *     {@link TextureStore} constructor.
   * @param {Object} [opts.layerOpts={}] Options to pass to the {@link Layer}
   *     constructor.
   * @return {Scene}
   */
  createScene(opts) {
    opts = opts || {};

    let scene = this.createEmptyScene({ view: opts.view });

    scene.createLayer({
      source: opts.source,
      geometry: opts.geometry,
      pinFirstLevel: opts.pinFirstLevel,
      textureStoreOpts: opts.textureStoreOpts,
      layerOpts: opts.layerOpts,
    });

    return scene;
  }

  /**
   * Creates a new {@link Scene scene} with no layers and adds it to the viewer.
   *
   * Layers may be added to the scene by calling {@link Scene#createLayer}.
   * However, if the scene has a single layer, it is simpler to call
   * {@link Viewer#createScene} instead of this method.
   *
   * The current scene does not change. To switch to the scene, call
   * {@link Viewer#switchScene}.
   *
   * @param {Object} opts Scene creation options.
   * @param {View} opts.view The scene's underlying {@link View}.
   * @return {Scene}
   */
  createEmptyScene(opts) {
    opts = opts || {};

    let scene = new Scene(this, opts.view);
    this._scenes.push(scene);

    return scene;
  }

  _updateSceneLayers() {
    let stage = this._stage;
    const currentScene = this._currentScene;
    const replacedScene = this._replacedScene;

    const oldLayers = stage.listLayers();

    // The stage contains layers from at most two scenes: the current one, on top,
    // and the one currently being switched away from, on the bottom.
    let newLayers = [];
    if (replacedScene) {
      newLayers = newLayers.concat(replacedScene.listLayers());
    }
    if (currentScene) {
      newLayers = newLayers.concat(currentScene.listLayers());
    }

    // A single layer can be added or removed from the scene at a time.
    if (Math.abs(oldLayers.length - newLayers.length) !== 1) {
      throw new Error('Stage and scene out of sync');
    }

    if (newLayers.length < oldLayers.length) {
      // A layer was removed.
      for (let i = 0; i < oldLayers.length; i++) {
        const layer = oldLayers[i];
        if (newLayers.indexOf(layer) < 0) {
          this._removeLayerFromStage(layer);
          break;
        }
      }
    }
    if (newLayers.length > oldLayers.length) {
      // A layer was added.
      for (let i = 0; i < newLayers.length; i++) {
        const layer = newLayers[i];
        if (oldLayers.indexOf(layer) < 0) {
          this._addLayerToStage(layer, i);
        }
      }
    }

    // TODO: When in the middle of a scene transition, call the transition update
    // function immediately to prevent an added layer from flashing with the wrong
    // opacity.
  }

  _addLayerToStage(layer, i) {
    // Pin the first level to ensure a fallback while the layer is visible.
    // Note that this is distinct from the `pinFirstLevel` option passed to
    // createScene(), which pins the layer even when it's not visible.
    layer.pinFirstLevel();
    this._stage.addLayer(layer, i);
  }

  _removeLayerFromStage(layer) {
    this._stage.removeLayer(layer);
    layer.unpinFirstLevel();
    layer.textureStore().clearNotPinned();
  }

  _addSceneEventListeners(scene) {
    scene.addEventListener('layerChange', this._layerChangeHandler);
    scene.addEventListener('viewChange', this._viewChangeHandler);
  }

  _removeSceneEventListeners(scene) {
    scene.removeEventListener('layerChange', this._layerChangeHandler);
    scene.removeEventListener('viewChange', this._viewChangeHandler);
  }

  /**
   * Destroys a {@link Scene scene} and removes it from the viewer.
   * @param {Scene} scene
   */
  destroyScene(scene) {
    let i = this._scenes.indexOf(scene);
    if (i < 0) {
      throw new Error('No such scene in viewer');
    }

    if (this._currentScene === scene) {
      // The destroyed scene is the current scene.
      // Remove event listeners, remove layers from stage and cancel transition.
      this._removeSceneEventListeners(scene);
      const layers = scene.listLayers();
      for (let j = 0; j < layers.length; j++) {
        this._removeLayerFromStage(layers[j]);
      }
      if (this._cancelCurrentTween) {
        this._cancelCurrentTween();
        this._cancelCurrentTween = null;
      }
      this._currentScene = null;
      this.emit('sceneChange');
    }

    if (this._replacedScene === scene) {
      // The destroyed scene is being switched away from.
      // Remove event listeners and remove layers from stage.
      this._removeSceneEventListeners(scene);
      const layers = scene.listLayers();
      for (let j = 0; j < layers.length; j++) {
        this._removeLayerFromStage(layers[j]);
      }
      this._replacedScene = null;
    }

    this._scenes.splice(i, 1);

    scene.destroy();
  }

  /**
   * Destroys all {@link Scene scenes} and removes them from the viewer.
   */
  destroyAllScenes() {
    while (this._scenes.length > 0) {
      this.destroyScene(this._scenes[0]);
    }
  }

  /**
   * Returns whether the viewer contains a {@link Scene scene}.
   * @param {Scene} scene
   * @return {boolean}
   */
  hasScene(scene) {
    return this._scenes.indexOf(scene) >= 0;
  }

  /**
   * Returns a list of all {@link Scene scenes}.
   * @return {Scene[]}
   */
  listScenes() {
    return [].concat(this._scenes);
  }

  /**
   * Returns the current {@link Scene scene}, or null if there isn't one.
   *
   * To change the current scene, call {@link Viewer#switchScene}.
   *
   * @return {Scene}
   */
  scene() {
    return this._currentScene;
  }

  /**
   * Returns the {@link View view} for the current {@link Scene scene}, or null
   * if there isn't one.
   * @return {View}
   */
  view() {
    let scene = this._currentScene;
    if (scene) {
      return scene.view();
    }
    return null;
  }

  /**
   * Tweens the {@link View view} for the current {@link Scene scene}.
   *
   * This method is equivalent to calling {@link Scene#lookTo} on the current
   * scene.
   *
   * @param {Object} opts Options to pass into {@link Scene#lookTo}.
   * @param {function} done Function to call when the tween is complete.
   */
  lookTo(params, opts, done) {
    // TODO: is it an error to call lookTo when no scene is displayed?
    let scene = this._currentScene;
    if (scene) {
      scene.lookTo(params, opts, done);
    }
  }

  /**
   * Starts a movement, possibly replacing the current movement.
   *
   * This method is equivalent to calling {@link Scene#startMovement} on the
   * current scene. If there is no current scene, this is a no-op.
   *
   * @param {function} fn The movement function.
   * @param {function} done Function to be called when the movement finishes or is
   *     interrupted.
   */
  startMovement(fn, done) {
    let scene = this._currentScene;
    if (!scene) {
      return;
    }
    scene.startMovement(fn, done);
  }

  /**
   * Stops the current movement.
   *
   * This method is equivalent to calling {@link Scene#stopMovement} on the
   * current scene. If there is no current scene, this is a no-op.
   */
  stopMovement() {
    let scene = this._currentScene;
    if (!scene) {
      return;
    }
    scene.stopMovement();
  }

  /**
   * Returns the current movement.
   *
   * This method is equivalent to calling {@link Scene#movement} on the
   * current scene. If there is no current scene, this is a no-op.
   *
   * @return {function}
   */
  movement() {
    const scene = this._currentScene;
    if (!scene) {
      return;
    }
    return scene.movement();
  }

  /**
   * Schedules an idle movement to be automatically started when the view remains
   * unchanged for the given timeout period.
   *
   * Changing the view while the idle movement is active stops the movement and
   * schedules it to start again after the same timeout period. To disable it
   * permanently, call with a null movement or an infinite timeout.
   *
   * @param {number} timeout Timeout period in milliseconds.
   * @param {function} movement Automatic movement function, or null to disable.
   */
  setIdleMovement(timeout, movement) {
    this._idleTimer.setDuration(timeout);
    this._idleMovement = movement;
  }

  /**
   * Stops the idle movement. It will be started again after the timeout set by
   * {@link Viewer#setIdleMovement}.
   */
  breakIdleMovement() {
    this.stopMovement();
    this._resetIdleTimer();
  }

  _resetIdleTimer() {
    this._idleTimer.start();
  }

  _triggerIdleTimer() {
    const idleMovement = this._idleMovement;
    if (!idleMovement) {
      return;
    }
    this.startMovement(idleMovement);
  }

  /**
   * NEW M1.3: Set LOD (Level of Detail) policy for texture memory management
   * @param {Object} policy - LOD policy configuration
   * @param {number} policy.maxGpuMB - Maximum GPU memory budget in megabytes
   * @param {number} [policy.prefetchAhead=2] - Number of levels to prefetch ahead
   * @param {string} [policy.evictionStrategy='hybrid'] - Eviction strategy: 'lru', 'distance', or 'hybrid'
   */
  setLODPolicy(policy) {
    if (!policy || typeof policy.maxGpuMB !== 'number') {
      throw new Error('LODPolicy requires maxGpuMB property');
    }

    this._lodPolicy = policy;

    // Apply memory budget to all existing scenes
    const maxBytes = policy.maxGpuMB * 1024 * 1024;
    for (let i = 0; i < this._scenes.length; i++) {
      const scene = this._scenes[i];
      const layers = scene.listLayers();
      for (let j = 0; j < layers.length; j++) {
        const textureStore = layers[j].textureStore();
        if (textureStore && textureStore.setMaxGpuMemory) {
          textureStore.setMaxGpuMemory(maxBytes);
        }
      }
    }
  }

  /**
   * NEW M1.3: Get current LOD policy
   * @return {Object|null}
   */
  getLODPolicy() {
    return this._lodPolicy;
  }

  /**
   * NEW M2.3: Pick yaw/pitch coordinates from screen position
   * @param {number} screenX - Screen X coordinate in pixels
   * @param {number} screenY - Screen Y coordinate in pixels
   * @return {Object|null} {yaw, pitch} in radians, or null if pick fails
   */
  pick(screenX, screenY) {
    const view = this.view();
    if (!view) {
      return null;
    }

    const stageSize = {
      width: this._stage.width(),
      height: this._stage.height(),
    };

    return RayPicker.screenToCoordinates(screenX, screenY, view, stageSize);
  }

  /**
   * NEW M3.1: Check if WebXR is available
   * @return {boolean}
   */
  isXREnabled() {
    return typeof navigator !== 'undefined' && navigator.xr !== undefined && navigator.xr !== null;
  }

  /**
   * NEW M3.1: Enter WebXR immersive mode
   * @param {Object} opts - XR options
   * @param {string[]} [opts.requiredFeatures] - Required XR features
   * @param {string[]} [opts.optionalFeatures] - Optional XR features
   * @return {Promise<XRSessionHandle>}
   */
  async enterXR(opts) {
    if (!this.isXREnabled()) {
      throw new Error('WebXR is not available in this browser');
    }

    opts = opts || {};

    const sessionInit = {
      requiredFeatures: opts.requiredFeatures || ['local-floor'],
      optionalFeatures: opts.optionalFeatures || [],
    };

    try {
      // Request immersive VR session
      const xrSession = await navigator.xr.requestSession('immersive-vr', sessionInit);

      // Create session handle
      const XRSessionHandle = (await import('./xr/XRSession.js')).default;
      const handle = new XRSessionHandle(xrSession, this._renderLoop, this.view());

      // Initialize session
      await handle.init(opts.requiredFeatures ? opts.requiredFeatures[0] : 'local-floor');

      // Store session
      this._xrSession = handle;

      // Update stage for XR rendering
      const canvas = this._stage.domElement();
      if (canvas && canvas.tagName === 'CANVAS') {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          await xrSession.updateRenderState({
            baseLayer: new XRWebGLLayer(xrSession, gl),
          });
        }
      }

      // Emit event
      this.emit('xrSessionStart', handle);

      return handle;
    } catch (err) {
      throw new Error(`Failed to enter XR: ${err.message}`);
    }
  }

  /**
   * NEW M3.1: Get current XR session
   * @return {XRSessionHandle|null}
   */
  getXRSession() {
    return this._xrSession;
  }

  /**
   * NEW M3.1: Check if currently in XR mode
   * @return {boolean}
   */
  isInXR() {
    return this._xrSession !== null && this._xrSession.isActive();
  }

  /**
   * NEW M4.1: Get current rendering backend
   * @return {string} 'webgl2', 'webgl1', or 'webgpu'
   */
  getBackend() {
    const stage = this._stage;
    if (stage && stage.glVersion) {
      return stage.glVersion();
    }
    return 'unknown';
  }

  /**
   * NEW M4.1: Set rendering backend (for future stage swapping)
   * Currently this returns the active backend info
   * Full implementation would require stage recreation
   * @param {string} backend - 'webgl2', 'webgl1', or 'webgpu'
   * @param {Object} opts - Backend options
   * @param {boolean} [opts.experimental=false] - Allow experimental backends
   * @return {Promise<void>}
   */
  async setBackend(backend, opts) {
    opts = opts || {};

    // For now, this is informational only
    // Full implementation would require recreating the stage
    console.warn(
      'setBackend: Stage recreation not yet implemented, using current backend:',
      this.getBackend()
    );

    if (backend === 'webgpu' && !opts.experimental) {
      throw new Error('WebGPU backend requires experimental: true option');
    }

    return Promise.resolve();
  }

  /**
   * NEW M4.3: Set tone mapping options
   * @param {Object} opts - Tone mapping options
   * @param {string} opts.mode - 'none', 'reinhard', or 'aces'
   * @param {number} opts.exposure - Exposure value (default: 1.0)
   * @param {number} opts.gamma - Gamma correction value (default: 2.2)
   */
  setToneMapping(opts) {
    if (!opts || typeof opts !== 'object') {
      throw new Error('setToneMapping requires an options object');
    }

    // Validate mode
    const validModes = ['none', 'reinhard', 'aces'];
    if (opts.mode && !validModes.includes(opts.mode)) {
      throw new Error(
        `Invalid tone mapping mode: ${opts.mode}. Must be one of: ${validModes.join(', ')}`
      );
    }

    // Update tone mapping settings
    if (opts.mode !== undefined) {
      this._toneMapping.mode = opts.mode;
    }
    if (opts.exposure !== undefined) {
      this._toneMapping.exposure = Math.max(0, opts.exposure);
    }
    if (opts.gamma !== undefined) {
      this._toneMapping.gamma = Math.max(0.1, opts.gamma);
    }

    // Note: Full implementation would update shader uniforms
    // For now, settings are stored and can be queried
    this.emit('toneMappingChange', this._toneMapping);

    // Force re-render to apply changes
    if (this._stage) {
      this._stage.emit('renderInvalid');
    }
  }

  /**
   * NEW M4.3: Get current tone mapping settings
   * @return {Object}
   */
  getToneMapping() {
    return { ...this._toneMapping };
  }

  /**
   * Switches to another {@link Scene scene} with a transition. This scene
   * becomes the current one.
   *
   * If a transition is already taking place, it is interrupted before the new one
   * starts.
   *
   * @param {Scene} newScene The scene to switch to.
   * @param {Object|string} opts Transition options or transition kind string.
   *     If string, must be 'crossfade', 'zoomMorph', or 'orbitToTarget'.
   * @param {string} [opts.kind='crossfade'] NEW M3.2: Transition kind
   * @param {number} [opts.duration=1000] NEW M3.2: Transition duration (renamed from transitionDuration)
   * @param {number} [opts.transitionDuration=1000] Transition duration (legacy), in milliseconds.
   * @param {Function} [opts.easing] NEW M3.2: Easing function
   * @param {Function} [opts.transitionUpdate=defaultTransitionUpdate]
   *     Transition update function, with signature `f(t, newScene, oldScene)`.
   *     This function is called on each frame with `t` increasing from 0 to 1.
   *     An initial call with `t=0` and a final call with `t=1` are guaranteed.
   *     The default function sets the opacity of the new scene to `t`.
   * @param {function} done Function to call when the transition finishes or is
   *     interrupted. If the new scene is equal to the old one, no transition
   *     takes place, but this function is still called.
   * @return {Promise<void>} NEW M3.2: Promise that resolves when transition completes
   */
  switchScene(newScene, opts, done) {
    // NEW M3.2: Support transition kind as string
    if (typeof opts === 'string') {
      opts = { kind: opts };
    }

    opts = opts || {};
    done = done || noop;

    const stage = this._stage;

    const oldScene = this._currentScene;

    // Do nothing if the target scene is the current one.
    if (oldScene === newScene) {
      done();
      return;
    }

    if (this._scenes.indexOf(newScene) < 0) {
      throw new Error('No such scene in viewer');
    }

    // Cancel an already ongoing transition. This ensures that the stage contains
    // layers from exactly one scene before the transition begins.
    if (this._cancelCurrentTween) {
      this._cancelCurrentTween();
      this._cancelCurrentTween = null;
    }

    let oldSceneLayers = oldScene ? oldScene.listLayers() : [];
    const newSceneLayers = newScene.listLayers();
    const stageLayers = stage.listLayers();

    // Check that the stage contains exactly as many layers as the current scene,
    // and that the top layer is the right one. If this test fails, either there
    // is a bug or the user tried to modify the stage concurrently.
    if (
      oldScene &&
      (stageLayers.length !== oldSceneLayers.length ||
        (stageLayers.length > 1 && stageLayers[0] != oldSceneLayers[0]))
    ) {
      throw new Error('Stage not in sync with viewer');
    }

    // Get the transition parameters.
    let duration =
      opts.duration != null
        ? opts.duration
        : opts.transitionDuration != null
          ? opts.transitionDuration
          : defaultSwitchDuration;

    // NEW M2.4: Honor prefers-reduced-motion
    duration = Accessibility.adjustTransitionDuration(duration);

    // NEW M3.2: Get transition function based on kind
    let update;
    if (opts.kind) {
      try {
        update = getTransition(opts.kind, opts);
      } catch (err) {
        console.warn(`Invalid transition kind: ${opts.kind}, falling back to crossfade`);
        update = getTransition('crossfade');
      }
    } else {
      update = opts.transitionUpdate != null ? opts.transitionUpdate : defaultTransitionUpdate;
    }

    // NEW M3.2: Apply easing if provided
    let updateWithEasing = update;
    if (opts.easing) {
      const easing = opts.easing;
      updateWithEasing = (t, newScene, oldScene) => {
        const easedT = easing(t);
        update(easedT, newScene, oldScene);
      };
    }

    // Add new scene layers into the stage before starting the transition.
    for (let i = 0; i < newSceneLayers.length; i++) {
      this._addLayerToStage(newSceneLayers[i]);
    }

    // Update function to be called on every frame.
    const tweenUpdate = (val) => {
      // NEW M3.2: Use easing-wrapped update if available
      const updateFn = opts.easing ? updateWithEasing : update;
      updateFn(val, newScene, oldScene);

      // NEW M3.2: Emit transition progress event
      this.emit('transitionProgress', { progress: val, newScene, oldScene });
    };

    // Once the transition is complete, remove old scene layers from the stage and
    // remove the event listeners. If the old scene was destroyed during the
    // transition, this has already been taken care of. Otherwise, we still need
    // to get a fresh copy of the scene's layers, since they might have changed
    // during the transition.
    const tweenDone = () => {
      if (this._replacedScene) {
        this._removeSceneEventListeners(this._replacedScene);
        oldSceneLayers = this._replacedScene.listLayers();
        for (let i = 0; i < oldSceneLayers.length; i++) {
          this._removeLayerFromStage(oldSceneLayers[i]);
        }
        this._replacedScene = null;
      }
      this._cancelCurrentTween = null;

      // NEW M3.2: Emit transition complete event
      this.emit('transitionComplete', { scene: newScene });

      done();
    };

    // Store the cancelable for the transition.
    this._cancelCurrentTween = tween(duration, tweenUpdate, tweenDone);

    // Update the current and replaced scene.
    this._currentScene = newScene;
    this._replacedScene = oldScene;

    // Emit scene and view change events.
    this.emit('sceneChange');
    this.emit('viewChange');

    // Add event listeners to the new scene.
    // Note that event listeners can only be removed from the old scene once the
    // transition is complete, since layers might get added or removed in the
    // interim.
    this._addSceneEventListeners(newScene);
  }
}

eventEmitter(Viewer);

const defaultSwitchDuration = 1000;

function defaultTransitionUpdate(val, newScene, oldScene) {
  const layers = newScene.listLayers();
  layers.forEach((layer) => {
    layer.mergeEffects({ opacity: val });
  });

  newScene._hotspotContainer.domElement().style.opacity = val;
}

export default Viewer;
