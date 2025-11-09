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



// Stages
export { default as WebGlStage } from './stages/WebGl.js';

// Renderers
export { default as WebGlCubeRenderer } from './renderers/WebGlCube.js';
export { default as WebGlFlatRenderer } from './renderers/WebGlFlat.js';
export { default as WebGlEquirectRenderer } from './renderers/WebGlEquirect.js';
export { default as registerDefaultRenderers } from './renderers/registerDefaultRenderers.js';

// Geometries
export { default as CubeGeometry } from './geometries/Cube.js';
export { default as FlatGeometry } from './geometries/Flat.js';
export { default as EquirectGeometry } from './geometries/Equirect.js';

// Views
export { default as RectilinearView } from './views/Rectilinear.js';
export { default as FlatView } from './views/Flat.js';

// Sources
export { default as ImageUrlSource } from './sources/ImageUrl.js';
export { default as SingleAssetSource } from './sources/SingleAsset.js';

// Assets
export { default as StaticAsset } from './assets/Static.js';
export { default as DynamicAsset } from './assets/Dynamic.js';

// Texture store
export { default as TextureStore } from './TextureStore.js';

// Layer
export { default as Layer } from './Layer.js';

// Render loop
export { default as RenderLoop } from './RenderLoop.js';

// Controls
export { default as KeyControlMethod } from './controls/Key.js';
export { default as DragControlMethod } from './controls/Drag.js';
export { default as QtvrControlMethod } from './controls/Qtvr.js';
export { default as ScrollZoomControlMethod } from './controls/ScrollZoom.js';
export { default as PinchZoomControlMethod } from './controls/PinchZoom.js';
export { default as VelocityControlMethod } from './controls/Velocity.js';
export { default as ElementPressControlMethod } from './controls/ElementPress.js';
export { default as Controls } from './controls/Controls.js';
export { default as Dynamics } from './controls/Dynamics.js';

// High-level API
export { default as Viewer } from './Viewer.js';
export { default as Scene } from './Scene.js';

// Hotspots
export { default as Hotspot } from './Hotspot.js';
export { default as HotspotContainer } from './HotspotContainer.js';

// Effects
export { default as colorEffects } from './colorEffects.js';

// Miscellaneous functions
export { default as registerDefaultControls } from './controls/registerDefaultControls.js';
export { default as autorotate } from './autorotate.js';

// Utility functions
import async from './util/async.js';
import cancelize from './util/cancelize.js';
import chain from './util/chain.js';
import clamp from './util/clamp.js';
import clearOwnProperties from './util/clearOwnProperties.js';
import cmp from './util/cmp.js';
import compose from './util/compose.js';
import convertFov from './util/convertFov.js';
import decimal from './util/decimal.js';
import defaults from './util/defaults.js';
import defer from './util/defer.js';
import degToRad from './util/degToRad.js';
import delay from './util/delay.js';
import dom from './util/dom.js';
import extend from './util/extend.js';
import hash from './util/hash.js';
import inherits from './util/inherits.js';
import mod from './util/mod.js';
import noop from './util/noop.js';
import now from './util/now.js';
import once from './util/once.js';
import pixelRatio from './util/pixelRatio.js';
import radToDeg from './util/radToDeg.js';
import real from './util/real.js';
import retry from './util/retry.js';
import tween from './util/tween.js';
import type from './util/type.js';

export const util = {
  async,
  cancelize,
  chain,
  clamp,
  clearOwnProperties,
  cmp,
  compose,
  convertFov,
  decimal,
  defaults,
  defer,
  degToRad,
  delay,
  dom,
  extend,
  hash,
  inherits,
  mod,
  noop,
  now,
  once,
  pixelRatio,
  radToDeg,
  real,
  retry,
  tween,
  type,
};

// Expose dependencies for clients to use
import bowser from 'bowser';
import * as glMatrix from 'gl-matrix';
import eventEmitter from 'minimal-event-emitter';
import hammerjs from 'hammerjs';

export const dependencies = {
  bowser,
  glMatrix,
  eventEmitter,
  hammerjs,
};
