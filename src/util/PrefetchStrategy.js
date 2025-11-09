/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @class PrefetchStrategy
 * @classdesc
 *
 * Implements predictive prefetch logic based on camera motion,
 * FOV direction, and known navigation targets (hotspots).
 */
class PrefetchStrategy {
  constructor() {
    // Track recent view changes to predict motion
    this._viewHistory = [];
    this._maxHistorySize = 10;

    // Motion vector (yaw/pitch velocity)
    this._motionVector = { yaw: 0, pitch: 0 };

    // Known navigation targets (e.g., hotspot positions)
    this._navigationTargets = [];
  }

  /**
   * Update view history with current view parameters
   * @param {Object} viewParams - Current view parameters (yaw, pitch, fov, etc.)
   * @param {number} timestamp - Current timestamp
   */
  updateViewHistory(viewParams, timestamp) {
    this._viewHistory.push({
      params: viewParams,
      timestamp,
    });

    // Limit history size
    if (this._viewHistory.length > this._maxHistorySize) {
      this._viewHistory.shift();
    }

    // Calculate motion vector
    this._calculateMotionVector();
  }

  /**
   * Calculate motion vector from view history
   * @private
   */
  _calculateMotionVector() {
    if (this._viewHistory.length < 2) {
      this._motionVector = { yaw: 0, pitch: 0 };
      return;
    }

    // Use last two entries to calculate velocity
    const prev = this._viewHistory[this._viewHistory.length - 2];
    const curr = this._viewHistory[this._viewHistory.length - 1];

    const dt = curr.timestamp - prev.timestamp;
    if (dt <= 0) {
      return;
    }

    // Calculate angular velocity (radians per millisecond)
    const dyaw = curr.params.yaw - prev.params.yaw;
    const dpitch = curr.params.pitch - prev.params.pitch;

    this._motionVector = {
      yaw: dyaw / dt,
      pitch: dpitch / dt,
    };
  }

  /**
   * Get current motion vector
   * @return {Object} Motion vector {yaw, pitch} in radians per millisecond
   */
  getMotionVector() {
    return this._motionVector;
  }

  /**
   * Add a navigation target (e.g., hotspot position)
   * @param {Object} target - Target coordinates {yaw, pitch}
   * @param {number} [priority=1] - Priority weight (higher = more important)
   */
  addNavigationTarget(target, priority = 1) {
    this._navigationTargets.push({
      yaw: target.yaw,
      pitch: target.pitch,
      priority,
    });
  }

  /**
   * Clear all navigation targets
   */
  clearNavigationTargets() {
    this._navigationTargets = [];
  }

  /**
   * Get prefetch priorities for tiles
   * @param {Array} tiles - Array of tiles to prioritize
   * @param {Object} currentView - Current view parameters
   * @return {Array} Tiles with priority scores
   */
  prioritizeTiles(tiles, currentView) {
    return tiles
      .map((tile) => {
        let priority = 0;

        // Priority 1: Center of current FOV (highest)
        const centerDistance = this._calculateAngularDistance(
          tile.centerYaw || 0,
          tile.centerPitch || 0,
          currentView.yaw || 0,
          currentView.pitch || 0
        );
        priority += 100 / (1 + centerDistance);

        // Priority 2: Motion vector direction
        if (
          Math.abs(this._motionVector.yaw) > 0.0001 ||
          Math.abs(this._motionVector.pitch) > 0.0001
        ) {
          const predictedYaw = currentView.yaw + this._motionVector.yaw * 500; // Predict 500ms ahead
          const predictedPitch = currentView.pitch + this._motionVector.pitch * 500;

          const motionDistance = this._calculateAngularDistance(
            tile.centerYaw || 0,
            tile.centerPitch || 0,
            predictedYaw,
            predictedPitch
          );
          priority += 50 / (1 + motionDistance);
        }

        // Priority 3: Navigation targets (hotspots)
        for (const target of this._navigationTargets) {
          const targetDistance = this._calculateAngularDistance(
            tile.centerYaw || 0,
            tile.centerPitch || 0,
            target.yaw,
            target.pitch
          );
          priority += (20 * target.priority) / (1 + targetDistance);
        }

        return {
          tile,
          priority,
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate angular distance between two points on a sphere
   * @private
   * @param {number} yaw1 - First yaw in radians
   * @param {number} pitch1 - First pitch in radians
   * @param {number} yaw2 - Second yaw in radians
   * @param {number} pitch2 - Second pitch in radians
   * @return {number} Angular distance
   */
  _calculateAngularDistance(yaw1, pitch1, yaw2, pitch2) {
    // Haversine formula for great circle distance
    const dYaw = yaw2 - yaw1;
    const dPitch = pitch2 - pitch1;

    const a =
      Math.sin(dPitch / 2) * Math.sin(dPitch / 2) +
      Math.cos(pitch1) * Math.cos(pitch2) * Math.sin(dYaw / 2) * Math.sin(dYaw / 2);

    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Determine if a tile should be prefetched based on current view
   * @param {Object} tile - Tile to check
   * @param {Object} currentView - Current view parameters
   * @param {number} [threshold=1.5] - Angular distance threshold in radians
   * @return {boolean}
   */
  shouldPrefetch(tile, currentView, threshold = 1.5) {
    const distance = this._calculateAngularDistance(
      tile.centerYaw || 0,
      tile.centerPitch || 0,
      currentView.yaw || 0,
      currentView.pitch || 0
    );

    return distance < threshold;
  }
}

export default PrefetchStrategy;
