/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @class RayPicker
 * @classdesc
 *
 * Utility for ray-picking (unprojecting screen coordinates to world coordinates).
 * Used for hotspot interaction and picking.
 */
class RayPicker {
  /**
   * Convert screen coordinates to yaw/pitch using a view
   * @param {number} screenX - Screen X coordinate (0 to width)
   * @param {number} screenY - Screen Y coordinate (0 to height)
   * @param {View} view - The view to use for unprojection
   * @param {Object} stageSize - Stage dimensions {width, height}
   * @return {Object|null} {yaw, pitch} in radians, or null if unprojection fails
   */
  static screenToCoordinates(screenX, screenY, view, stageSize) {
    if (!view || !view.screenToCoordinates) {
      return null;
    }

    // Normalize screen coordinates to [-1, 1] range
    const normalizedX = (screenX / stageSize.width) * 2 - 1;
    const normalizedY = 1 - (screenY / stageSize.height) * 2; // Flip Y axis

    const screen = {
      x: normalizedX,
      y: normalizedY,
    };

    try {
      const coords = view.screenToCoordinates(screen);
      return coords;
    } catch {
      // View doesn't support unprojection or coordinates are out of bounds
      return null;
    }
  }

  /**
   * Convert yaw/pitch to screen coordinates using a view
   * @param {number} yaw - Yaw in radians
   * @param {number} pitch - Pitch in radians
   * @param {View} view - The view to use for projection
   * @param {Object} stageSize - Stage dimensions {width, height}
   * @return {Object|null} {x, y} in screen pixels, or null if projection fails
   */
  static coordinatesToScreen(yaw, pitch, view, stageSize) {
    if (!view || !view.coordinatesToScreen) {
      return null;
    }

    const coords = { yaw, pitch };

    try {
      const screen = view.coordinatesToScreen(coords);
      if (!screen) {
        return null;
      }

      // Convert from normalized [-1, 1] to screen coordinates
      const x = ((screen.x + 1) / 2) * stageSize.width;
      const y = ((1 - screen.y) / 2) * stageSize.height;

      return { x, y };
    } catch {
      // View doesn't support projection or coordinates are out of bounds
      return null;
    }
  }

  /**
   * Check if coordinates are visible in the current view
   * @param {number} yaw - Yaw in radians
   * @param {number} pitch - Pitch in radians
   * @param {View} view - The view to check against
   * @return {boolean}
   */
  static isVisible(yaw, pitch, view) {
    if (!view || !view.coordinatesToScreen) {
      return true; // Assume visible if we can't check
    }

    const coords = { yaw, pitch };

    try {
      const screen = view.coordinatesToScreen(coords);

      // Check if coordinates are within viewport (normalized coordinates)
      return screen !== null && screen.x >= -1 && screen.x <= 1 && screen.y >= -1 && screen.y <= 1;
    } catch {
      return false;
    }
  }

  /**
   * Calculate angular distance between two points
   * @param {number} yaw1 - First yaw in radians
   * @param {number} pitch1 - First pitch in radians
   * @param {number} yaw2 - Second yaw in radians
   * @param {number} pitch2 - Second pitch in radians
   * @return {number} Angular distance in radians
   */
  static angularDistance(yaw1, pitch1, yaw2, pitch2) {
    // Haversine formula for great circle distance
    const dYaw = yaw2 - yaw1;
    const dPitch = pitch2 - pitch1;

    const a =
      Math.sin(dPitch / 2) * Math.sin(dPitch / 2) +
      Math.cos(pitch1) * Math.cos(pitch2) * Math.sin(dYaw / 2) * Math.sin(dYaw / 2);

    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export default RayPicker;
