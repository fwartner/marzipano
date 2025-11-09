/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @class LODPolicy
 * @classdesc
 *
 * Manages Level-of-Detail (LOD) policies including memory budgets,
 * eviction strategies, and prefetch behavior.
 */
class LODPolicy {
  /**
   * @param {Object} opts - Policy options
   * @param {number} opts.maxGpuMB - Maximum GPU memory budget in megabytes
   * @param {number} [opts.prefetchAhead=2] - Number of levels to prefetch ahead
   * @param {string} [opts.evictionStrategy='hybrid'] - Eviction strategy: 'lru', 'distance', or 'hybrid'
   */
  constructor(opts) {
    this._maxGpuMB = opts.maxGpuMB || 256;
    this._prefetchAhead = opts.prefetchAhead !== undefined ? opts.prefetchAhead : 2;
    this._evictionStrategy = opts.evictionStrategy || 'hybrid';

    // Validate eviction strategy
    const validStrategies = ['lru', 'distance', 'hybrid'];
    if (!validStrategies.includes(this._evictionStrategy)) {
      throw new Error(
        `Invalid eviction strategy: ${this._evictionStrategy}. Must be one of: ${validStrategies.join(', ')}`
      );
    }
  }

  /**
   * Get maximum GPU memory budget in bytes
   * @return {number}
   */
  maxGpuBytes() {
    return this._maxGpuMB * 1024 * 1024;
  }

  /**
   * Get maximum GPU memory budget in megabytes
   * @return {number}
   */
  maxGpuMB() {
    return this._maxGpuMB;
  }

  /**
   * Set maximum GPU memory budget in megabytes
   * @param {number} mb
   */
  setMaxGpuMB(mb) {
    this._maxGpuMB = mb;
  }

  /**
   * Get prefetch ahead level count
   * @return {number}
   */
  prefetchAhead() {
    return this._prefetchAhead;
  }

  /**
   * Set prefetch ahead level count
   * @param {number} count
   */
  setPrefetchAhead(count) {
    this._prefetchAhead = count;
  }

  /**
   * Get eviction strategy
   * @return {string}
   */
  evictionStrategy() {
    return this._evictionStrategy;
  }

  /**
   * Set eviction strategy
   * @param {string} strategy - 'lru', 'distance', or 'hybrid'
   */
  setEvictionStrategy(strategy) {
    const validStrategies = ['lru', 'distance', 'hybrid'];
    if (!validStrategies.includes(strategy)) {
      throw new Error(
        `Invalid eviction strategy: ${strategy}. Must be one of: ${validStrategies.join(', ')}`
      );
    }
    this._evictionStrategy = strategy;
  }

  /**
   * Calculate eviction score for a texture
   * Lower score = more likely to be evicted
   *
   * @param {Object} tile - Tile data
   * @param {number} lastAccessTime - Last access timestamp
   * @param {number} distanceFromCamera - Distance metric from camera
   * @param {number} currentTime - Current timestamp
   * @return {number} Eviction score
   */
  calculateEvictionScore(tile, lastAccessTime, distanceFromCamera, currentTime) {
    const strategy = this._evictionStrategy;

    // LRU component (time since last access)
    const timeSinceAccess = currentTime - lastAccessTime;
    const lruScore = 1 / (1 + timeSinceAccess);

    // Distance component (proximity to camera)
    const distanceScore = 1 / (1 + distanceFromCamera);

    // Level component (prefer higher resolution)
    const levelScore = tile.z !== undefined ? tile.z / 10 : 0;

    if (strategy === 'lru') {
      return lruScore;
    } else if (strategy === 'distance') {
      return distanceScore + levelScore * 0.1;
    } else {
      // Hybrid: combine LRU and distance
      return lruScore * 0.6 + distanceScore * 0.3 + levelScore * 0.1;
    }
  }

  /**
   * Determine if prefetch should occur for a given level
   * @param {number} currentLevel - Current visible level
   * @param {number} targetLevel - Target level to check
   * @return {boolean}
   */
  shouldPrefetchLevel(currentLevel, targetLevel) {
    return targetLevel <= currentLevel + this._prefetchAhead;
  }
}

export default LODPolicy;
