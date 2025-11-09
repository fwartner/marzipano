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
import positionAbsolutely from './util/positionAbsolutely.js';
import clearOwnProperties from './util/clearOwnProperties.js';
import RayPicker from './util/RayPicker.js';

import { setTransform } from './util/dom.js';

/**
 * @class Hotspot
 * @classdesc
 *
 * A Hotspot allows a DOM element to be placed at a fixed position in the
 * image. The position is updated automatically when the {@link View view}
 * changes.
 *
 * Positioning is performed with the `transform` CSS property when available,
 * falling back to the `position`, `left` and `top` properties when not.
 * In both cases, the top left corner of the element is placed in the requested
 * position; clients are expected to use additional children elements or other
 * CSS properties to achieve more sophisticated layouts.
 *
 * There are two kinds of hotspots: regular and embedded. A regular hotspot
 * does not change size depending on the zoom level. An embedded hotspot is
 * displayed at a fixed size relative to the panorama, always covering the
 * same portion of the image.
 *
 * Clients should call {@link HotspotContainer#createHotspot} instead of
 * invoking the constructor directly.
 *
 * @param {Element} domElement The DOM element.
 * @param {View} view The view.
 * @param {Object} coords The hotspot coordinates.
 *     Use {@link RectilinearViewCoords} for a {@link RectilinearView} or
 *     {@link FlatViewCoords} for a {@link FlatView}.
 * @param {Object} opts Additional options.
 * @param {Object} opts.perspective Perspective options for embedded hotspots.
 * @param {number} [opts.perspective.radius=null] If set, embed the hotspot
 *     into the image by transforming it into the surface of a sphere with this
 *     radius.
 * @param {string} [opts.perspective.extraTransforms=null] If set, append this
 *     value to the CSS `transform` property used to position the hotspot. This
 *     may be used to rotate an embedded hotspot.
 */
class Hotspot {
  constructor(domElement, parentDomElement, view, coords, opts) {
    opts = opts || {};
    opts.perspective = opts.perspective || {};
    opts.perspective.extraTransforms =
      opts.perspective.extraTransforms != null ? opts.perspective.extraTransforms : '';

    this._domElement = domElement;
    this._parentDomElement = parentDomElement;
    this._view = view;
    this._coords = {};
    this._perspective = {};

    // NEW M2.3: Hotspot Engine v2 options
    this._kind = opts.kind || 'dom'; // 'dom' or 'embedded'
    this._zIndex = opts.zIndex !== undefined ? opts.zIndex : 0;
    this._occlusion = opts.occlusion || 'none'; // 'none', 'hide', 'dim'
    this._ariaLabel = opts.ariaLabel || null;
    this._tabbable = opts.tabbable !== undefined ? opts.tabbable : false;

    this.setPosition(coords);

    // Add hotspot into the DOM.
    this._parentDomElement.appendChild(this._domElement);

    this.setPerspective(opts.perspective);

    // NEW M2.3: Apply z-index
    if (this._zIndex !== 0) {
      this._domElement.style.zIndex = this._zIndex.toString();
    }

    // NEW M2.3: Apply ARIA attributes
    if (this._ariaLabel) {
      this._domElement.setAttribute('aria-label', this._ariaLabel);
    }

    // NEW M2.3: Set tabindex for keyboard navigation
    if (this._tabbable) {
      this._domElement.setAttribute('tabindex', '0');
    } else {
      this._domElement.setAttribute('tabindex', '-1');
    }

    // Whether the hotspot is visible.
    // The hotspot may still be hidden if it's inside a hidden HotspotContainer.
    this._visible = true;

    // The current calculated screen position.
    this._position = { x: 0, y: 0 };
  }

  /**
   * Destructor.
   * Clients should call {@link HotspotContainer#destroyHotspot} instead.
   */
  destroy() {
    this._parentDomElement.removeChild(this._domElement);
    clearOwnProperties(this);
  }

  /**
   * @return {Element}
   */
  domElement() {
    return this._domElement;
  }

  /**
   * @return {Object}
   */
  position() {
    return this._coords;
  }

  /**
   * @param {Object} coords
   */
  setPosition(coords) {
    for (const key in coords) {
      this._coords[key] = coords[key];
    }
    this._update();
    // TODO: We should probably emit a hotspotsChange event on the parent
    // HotspotContainer. What's the best way to do so?
  }

  /**
   * @return {Object}
   */
  perspective() {
    return this._perspective;
  }

  /**
   * @param {Object}
   */
  setPerspective(perspective) {
    for (const key in perspective) {
      this._perspective[key] = perspective[key];
    }
    this._update();
  }

  /**
   * Show the hotspot
   */
  show() {
    if (!this._visible) {
      this._visible = true;
      this._update();
    }
  }

  /**
   * Hide the hotspot
   */
  hide() {
    if (this._visible) {
      this._visible = false;
      this._update();
    }
  }

  _update() {
    const element = this._domElement;

    const params = this._coords;
    let position = this._position;
    let x, y;

    let isVisible = false;

    if (this._visible) {
      const view = this._view;

      // NEW M2.3: Use kind to determine positioning mode
      const isEmbedded = this._kind === 'embedded' || this._perspective.radius;

      if (isEmbedded) {
        // Hotspots that are embedded in the panorama may be visible even when
        // positioned behind the camera.
        isVisible = true;
        this._setEmbeddedPosition(view, params);
      } else {
        // Regular hotspots are only visible when positioned in front of the
        // camera. Note that they may be partially visible when positioned outside
        // the viewport.
        view.coordinatesToScreen(params, position);
        x = position.x;
        y = position.y;

        if (x != null && y != null) {
          isVisible = true;
          this._setPosition(x, y);
        }
      }

      // NEW M2.3: Apply occlusion
      if (isVisible && this._occlusion !== 'none') {
        const occluded = !RayPicker.isVisible(params.yaw || 0, params.pitch || 0, view);

        if (occluded) {
          if (this._occlusion === 'hide') {
            isVisible = false;
          } else if (this._occlusion === 'dim') {
            element.style.opacity = '0.3';
          }
        } else {
          element.style.opacity = '1';
        }
      }
    }

    // Show if visible, hide if not.
    if (isVisible) {
      element.style.display = 'block';
      element.style.position = 'absolute';
    } else {
      element.style.display = 'none';
      element.style.position = '';
    }
  }

  _setEmbeddedPosition(view, params) {
    const transform = view.coordinatesToPerspectiveTransform(
      params,
      this._perspective.radius,
      this._perspective.extraTransforms
    );
    setTransform(this._domElement, transform);
  }

  _setPosition(x, y) {
    positionAbsolutely(this._domElement, x, y, this._perspective.extraTransforms);
  }

  /**
   * NEW M2.3: Set z-index for layering
   * @param {number} zIndex
   */
  setZIndex(zIndex) {
    this._zIndex = zIndex;
    this._domElement.style.zIndex = zIndex.toString();
  }

  /**
   * NEW M2.3: Get z-index
   * @return {number}
   */
  getZIndex() {
    return this._zIndex;
  }

  /**
   * NEW M2.3: Set occlusion mode
   * @param {'none'|'hide'|'dim'} mode
   */
  setOcclusion(mode) {
    this._occlusion = mode;
    this._update();
  }

  /**
   * NEW M2.3: Get occlusion mode
   * @return {string}
   */
  getOcclusion() {
    return this._occlusion;
  }

  /**
   * NEW M2.3: Set hotspot kind
   * @param {'dom'|'embedded'} kind
   */
  setKind(kind) {
    this._kind = kind;
    this._update();
  }

  /**
   * NEW M2.3: Get hotspot kind
   * @return {string}
   */
  getKind() {
    return this._kind;
  }

  /**
   * NEW M2.3: Set ARIA label
   * @param {string} label
   */
  setAriaLabel(label) {
    this._ariaLabel = label;
    if (label) {
      this._domElement.setAttribute('aria-label', label);
    } else {
      this._domElement.removeAttribute('aria-label');
    }
  }

  /**
   * NEW M2.3: Get ARIA label
   * @return {string|null}
   */
  getAriaLabel() {
    return this._ariaLabel;
  }

  /**
   * NEW M2.3: Set tabbable (keyboard focusable)
   * @param {boolean} tabbable
   */
  setTabbable(tabbable) {
    this._tabbable = tabbable;
    if (tabbable) {
      this._domElement.setAttribute('tabindex', '0');
    } else {
      this._domElement.setAttribute('tabindex', '-1');
    }
  }

  /**
   * NEW M2.3: Get tabbable
   * @return {boolean}
   */
  getTabbable() {
    return this._tabbable;
  }
}

eventEmitter(Hotspot);

export default Hotspot;
