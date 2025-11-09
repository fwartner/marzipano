/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @module transitions
 * @desc Scene transition implementations for smooth scene switching.
 */

/**
 * Crossfade transition: fades out old scene while fading in new scene
 * @param {number} t - Transition progress (0 to 1)
 * @param {Scene} newScene - Scene being transitioned to
 * @param {Scene} oldScene - Scene being transitioned from
 */
export function crossfade(t, newScene, oldScene) {
  // Fade out old scene
  if (oldScene) {
    const oldLayers = oldScene.listLayers();
    oldLayers.forEach((layer) => {
      layer.mergeEffects({ opacity: 1 - t });
    });
    if (oldScene._hotspotContainer) {
      oldScene._hotspotContainer.domElement().style.opacity = (1 - t).toString();
    }
  }

  // Fade in new scene
  const newLayers = newScene.listLayers();
  newLayers.forEach((layer) => {
    layer.mergeEffects({ opacity: t });
  });
  if (newScene._hotspotContainer) {
    newScene._hotspotContainer.domElement().style.opacity = t.toString();
  }
}

/**
 * Zoom morph transition: zooms out of old scene and into new scene
 * @param {number} t - Transition progress (0 to 1)
 * @param {Scene} newScene - Scene being transitioned to
 * @param {Scene} oldScene - Scene being transitioned from
 * @param {Object} opts - Transition options
 * @param {number} [opts.maxZoomOut=0.5] - Maximum zoom out factor (0 to 1)
 */
export function zoomMorph(t, newScene, oldScene, opts = {}) {
  const maxZoomOut = opts.maxZoomOut !== undefined ? opts.maxZoomOut : 0.5;

  // Calculate zoom curve (zoom out then in)
  // t=0: zoom=1, t=0.5: zoom=maxZoomOut, t=1: zoom=1
  const zoomCurve =
    t < 0.5 ? 1 - (1 - maxZoomOut) * (t * 2) : maxZoomOut + (1 - maxZoomOut) * ((t - 0.5) * 2);

  // Apply zoom to both scenes
  if (oldScene) {
    const oldView = oldScene.view();
    const oldParams = oldView.parameters();

    if (t < 0.5 && oldParams.fov !== undefined) {
      // Zoom out old scene
      const adjustedFov = oldParams.fov / zoomCurve;
      oldView.setParameters({ ...oldParams, fov: adjustedFov });
    }

    // Fade out old scene in second half
    const oldOpacity = t < 0.5 ? 1 : 1 - (t - 0.5) * 2;
    const oldLayers = oldScene.listLayers();
    oldLayers.forEach((layer) => {
      layer.mergeEffects({ opacity: oldOpacity });
    });
    if (oldScene._hotspotContainer) {
      oldScene._hotspotContainer.domElement().style.opacity = oldOpacity.toString();
    }
  }

  // Apply zoom to new scene
  const newView = newScene.view();
  const newParams = newView.parameters();

  if (t >= 0.5 && newParams.fov !== undefined) {
    // Zoom in new scene
    const adjustedFov = newParams.fov / zoomCurve;
    newView.setParameters({ ...newParams, fov: adjustedFov });
  }

  // Fade in new scene in second half
  const newOpacity = t < 0.5 ? 0 : (t - 0.5) * 2;
  const newLayers = newScene.listLayers();
  newLayers.forEach((layer) => {
    layer.mergeEffects({ opacity: newOpacity });
  });
  if (newScene._hotspotContainer) {
    newScene._hotspotContainer.domElement().style.opacity = newOpacity.toString();
  }
}

/**
 * Orbit to target transition: rotates camera while transitioning
 * @param {number} t - Transition progress (0 to 1)
 * @param {Scene} newScene - Scene being transitioned to
 * @param {Scene} oldScene - Scene being transitioned from
 * @param {Object} opts - Transition options
 * @param {number} [opts.orbitYaw=Math.PI/2] - Amount to orbit in yaw (radians)
 * @param {number} [opts.orbitPitch=0] - Amount to orbit in pitch (radians)
 */
export function orbitToTarget(t, newScene, oldScene, opts = {}) {
  const orbitYaw = opts.orbitYaw !== undefined ? opts.orbitYaw : Math.PI / 2;
  const orbitPitch = opts.orbitPitch !== undefined ? opts.orbitPitch : 0;

  // Crossfade opacity
  if (oldScene) {
    const oldLayers = oldScene.listLayers();
    oldLayers.forEach((layer) => {
      layer.mergeEffects({ opacity: 1 - t });
    });
    if (oldScene._hotspotContainer) {
      oldScene._hotspotContainer.domElement().style.opacity = (1 - t).toString();
    }
  }

  const newLayers = newScene.listLayers();
  newLayers.forEach((layer) => {
    layer.mergeEffects({ opacity: t });
  });
  if (newScene._hotspotContainer) {
    newScene._hotspotContainer.domElement().style.opacity = t.toString();
  }

  // Orbit the camera
  const newView = newScene.view();
  const newParams = newView.parameters();

  if (newParams.yaw !== undefined) {
    // Apply orbital rotation
    const currentYaw = newParams.yaw + orbitYaw * t;
    const currentPitch = newParams.pitch + orbitPitch * t;

    newView.setParameters({
      ...newParams,
      yaw: currentYaw,
      pitch: currentPitch,
    });
  }
}

/**
 * Get transition function by kind
 * @param {string} kind - Transition kind: 'crossfade', 'zoomMorph', 'orbitToTarget'
 * @param {Object} opts - Transition-specific options
 * @return {Function} Transition function
 */
export function getTransition(kind, opts = {}) {
  switch (kind) {
    case 'crossfade':
      return (t, newScene, oldScene) => crossfade(t, newScene, oldScene);
    case 'zoomMorph':
      return (t, newScene, oldScene) => zoomMorph(t, newScene, oldScene, opts);
    case 'orbitToTarget':
      return (t, newScene, oldScene) => orbitToTarget(t, newScene, oldScene, opts);
    default:
      throw new Error(`Unknown transition kind: ${kind}`);
  }
}

export default {
  crossfade,
  zoomMorph,
  orbitToTarget,
  getTransition,
};
