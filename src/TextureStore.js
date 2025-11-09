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

import Map from './collections/Map.js';
import Set from './collections/Set.js';
import LruSet from './collections/LruSet.js';
import eventEmitter from 'minimal-event-emitter';
import defaults from './util/defaults.js';
import retry from './util/retry.js';
import chain from './util/chain.js';
import clearOwnProperties from './util/clearOwnProperties.js';

const debug = typeof MARZIPANODEBUG !== 'undefined' && MARZIPANODEBUG.textureStore;

// A Stage informs the TextureStore about the set of visible tiles during a
// frame by calling startFrame, markTile and endFrame. In a particular frame,
// TextureStore expects one or more calls to startFrame, followed by zero or
// more calls to markTile, followed by one or more calls to endFrame. The
// number of calls to startFrame and endFrame must match. Calls to other
// TextureStore methods may be freely interleaved with this sequence.
//
// At any given time, TextureStore is in one of four states. The START state
// corresponds to the interval between the first startFrame and the first
// markTile of a frame. The MARK state corresponds to the interval between the
// first markTile and the first endFrame. The END state corresponds to the
// interval between the first and the last endFrame. At any other time, the
// TextureStore is in the IDLE state.
const State = {
  IDLE: 0,
  START: 1,
  MARK: 2,
  END: 3,
};

const defaultOptions = {
  // Maximum number of cached textures for previously visible tiles.
  previouslyVisibleCacheSize: 512,
  // NEW: Maximum GPU memory budget in bytes (256 MB default)
  maxGpuMemory: 256 * 1024 * 1024,
  // NEW: Enable memory-based eviction
  enforceMemoryBudget: true,
};

// Assign an id to each operation so we can track its state.
// We actually only need this in debug mode, but the code is less convoluted
// if we track unconditionally, and the performance hit is minimal anyway.
let nextId = 0;

// Distinguishes a cancellation from other kinds of errors.
class CancelError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CancelError';
  }
}

/**
 * @class TextureStoreItem
 * @classdesc
 *
 * An item saved in a {@link TextureStore}.
 *
 * Clients do not need to instantiate this. It is automatically instantiated by
 * a {@link TextureStore} to manage the lifetime of a stored item: loading,
 * refreshing, unloading and emitting associated events.
 *
 * @param {TextureStore} store The underlying {@link TextureStore}.
 * @param {Tile} tile The underlying tile.
 */
class TextureStoreItem {
  constructor(store, tile) {
    const id = nextId++;

    this._id = id;
    this._store = store;
    this._tile = tile;

    this._asset = null;
    this._texture = null;

    this._changeHandler = () => {
      store.emit('textureInvalid', tile);
    };

    const source = store.source();
    const stage = store.stage();

    const loadAsset = source.loadAsset.bind(source);
    const createTexture = stage.createTexture.bind(stage);

    // Retry loading the asset until it succeeds, then create the texture from it.
    // This process may be canceled at any point by calling the destroy() method.
    const fn = chain(retry(loadAsset), createTexture);

    store.emit('textureStartLoad', tile);
    if (debug) {
      console.log('loading', id, tile);
    }

    this._cancel = fn(stage, tile, (err, _tile, asset, texture) => {
      // Make sure we do not call cancel after the operation is complete.
      this._cancel = null;

      if (err) {
        // The loading process was interrupted by an error.
        // This could either be because the texture creation failed, or because
        // the operation was canceled before the loading was complete.

        // Destroy the asset and texture, if they exist.
        if (asset) {
          asset.destroy();
        }
        if (texture) {
          texture.destroy();
        }

        // Emit events.
        if (err instanceof CancelError) {
          store.emit('textureCancel', tile);
          if (debug) {
            console.log('cancel', id, tile);
          }
        } else {
          store.emit('textureError', tile, err);
          if (debug) {
            console.log('error', id, tile);
          }
        }

        return;
      }

      // Save a local reference to the texture.
      this._texture = texture;

      // If the asset is dynamic, save a local reference to it and set up a
      // handler to be called whenever it changes. Otherwise, destroy the asset
      // as we won't be needing it any longer.
      if (asset.isDynamic()) {
        this._asset = asset;
        asset.addEventListener('change', this._changeHandler);
      } else {
        asset.destroy();
      }

      // Emit event.
      store.emit('textureLoad', tile);
      if (debug) {
        console.log('load', id, tile);
      }
    });
  }

  asset() {
    return this._asset;
  }

  texture() {
    return this._texture;
  }

  destroy() {
    const id = this._id;
    const store = this._store;
    const tile = this._tile;
    const asset = this._asset;
    const texture = this._texture;
    const cancel = this._cancel;

    if (cancel) {
      // The texture is still loading, so cancel it.
      cancel(new CancelError('Texture load cancelled'));
      return;
    }

    // Destroy asset.
    if (asset) {
      asset.removeEventListener('change', this._changeHandler);
      asset.destroy();
    }

    // Destroy texture.
    if (texture) {
      texture.destroy();
    }

    // Emit event.
    store.emit('textureUnload', tile);
    if (debug) {
      console.log('unload', id, tile);
    }

    clearOwnProperties(this);
  }
}

eventEmitter(TextureStoreItem);

/**
 * Signals that a texture has started to load.
 *
 * This event is followed by either {@link TextureStore#textureLoad},
 * {@link TextureStore#textureError} or {@link TextureStore#textureCancel}.
 *
 * @event TextureStore#textureStartLoad
 * @param {Tile} tile The tile for which the texture has started to load.
 */

/**
 * Signals that a texture has been loaded.
 *
 * @event TextureStore#textureLoad
 * @param {Tile} tile The tile for which the texture was loaded.
 */

/**
 * Signals that a texture has been unloaded.
 *
 * @event TextureStore#textureUnload
 * @param {Tile} tile The tile for which the texture was unloaded.
 */

/**
 * Signals that a texture has been invalidated.
 *
 * This event may be raised for a texture with an underlying dynamic asset. It
 * may only occur while the texture is loaded, i.e., in between
 * {@link TextureStore#textureLoad} and {@link TextureStore#textureUnload}.
 *
 * @event TextureStore#textureInvalid
 * @param {Tile} tile The tile for which the texture was invalidated.
 */

/**
 * Signals that loading a texture has been cancelled.
 *
 * This event may follow {@link TextureStore#textureStartLoad} if the texture
 * becomes unnecessary before it finishes loading.
 *
 * @event TextureStore#textureCancel
 * @param {Tile} tile The tile for which the texture loading was cancelled.
 */

/**
 * Signals that loading a texture has failed.
 *
 * This event may follow {@link TextureStore#textureStartLoad} if the texture
 * fails to load.
 *
 * @event TextureStore#textureError
 * @param {Tile} tile The tile for which the texture loading has failed.
 */

/**
 * @class TextureStore
 * @classdesc
 *
 * A TextureStore maintains a cache of textures used to render a {@link Layer}.
 *
 * A {@link Stage} communicates with the TextureStore through the startFrame(),
 * markTile() and endFrame() methods, which indicate the tiles that are visible
 * in the current frame. Textures for visible tiles are loaded and retained
 * as long as the tiles remain visible. A limited amount of textures whose
 * tiles were previously visible are cached according to an LRU policy. Tiles
 * may be pinned to keep their respective textures cached even when they are
 * invisible; these textures do not count towards the previously visible limit.
 *
 * Multiple layers belonging to the same underlying {@link WebGlStage} may
 * share the same TextureStore. Layers belonging to distinct {@link WebGlStage}
 * instances may not do so due to restrictions on the use of textures across
 * stages.
 *
 * @param {Source} source The underlying source.
 * @param {Stage} stage The underlying stage.
 * @param {Object} opts Options.
 * @param {Number} [opts.previouslyVisibleCacheSize=32] The maximum number of
 *     previously visible textures to cache according to an LRU policy.
 */
class TextureStore {
  constructor(source, stage, opts) {
    opts = defaults(opts || {}, defaultOptions);

    this._source = source;
    this._stage = stage;

    // The current state.
    this._state = State.IDLE;

    // The number of startFrame calls yet to be matched by endFrame calls during
    // the current frame.
    this._delimCount = 0;

    // The cache proper: map cached tiles to their respective textures/assets.
    this._itemMap = new Map();

    // The subset of cached tiles that are currently visible.
    this._visible = new Set();

    // The subset of cached tiles that were visible recently, but are not
    // visible right now. Newly inserted tiles replace older ones.
    this._previouslyVisible = new LruSet(opts.previouslyVisibleCacheSize);

    // The subset of cached tiles that should never be evicted from the cache.
    // A tile may be pinned more than once; map each tile into a reference count.
    this._pinMap = new Map();

    // NEW: Memory budget tracking
    this._maxGpuMemory = opts.maxGpuMemory;
    this._enforceMemoryBudget = opts.enforceMemoryBudget;
    this._currentGpuMemory = 0;
    this._tileMemoryMap = new Map(); // Track memory per tile
    this._tileAccessMap = new Map(); // Track last access time per tile
    this._tileHitCount = 0; // Telemetry: cache hits
    this._tileMissCount = 0; // Telemetry: cache misses

    // Temporary variables.
    this._newVisible = new Set();
    this._noLongerVisible = [];
    this._visibleAgain = [];
    this._evicted = [];
  }

  /**
   * Destructor.
   */
  destroy() {
    this.clear();
    clearOwnProperties(this);
  }

  /**
   * Return the underlying {@link Stage}.
   * @return {Stage}
   */
  stage() {
    return this._stage;
  }

  /**
   * Return the underlying {@link Source}.
   * @return {Source}
   */
  source() {
    return this._source;
  }

  /**
   * NEW: Get current GPU memory usage in bytes
   * @return {number}
   */
  gpuMemoryUsage() {
    return this._currentGpuMemory;
  }

  /**
   * NEW: Get GPU memory usage in megabytes
   * @return {number}
   */
  gpuMemoryUsageMB() {
    return this._currentGpuMemory / (1024 * 1024);
  }

  /**
   * NEW: Get maximum GPU memory budget in bytes
   * @return {number}
   */
  maxGpuMemory() {
    return this._maxGpuMemory;
  }

  /**
   * NEW: Set maximum GPU memory budget in bytes
   * @param {number} bytes
   */
  setMaxGpuMemory(bytes) {
    this._maxGpuMemory = bytes;
  }

  /**
   * NEW: Get number of resident textures
   * @return {number}
   */
  residentTextureCount() {
    return this._itemMap.size;
  }

  /**
   * NEW: Get telemetry data
   * @return {Object}
   */
  telemetryData() {
    return {
      gpuMemoryUsage: this._currentGpuMemory,
      gpuMemoryUsageMB: this.gpuMemoryUsageMB(),
      maxGpuMemory: this._maxGpuMemory,
      residentTextures: this.residentTextureCount(),
      cacheHits: this._tileHitCount,
      cacheMisses: this._tileMissCount,
    };
  }

  /**
   * NEW: Estimate texture memory size in bytes
   * @private
   * @param {Tile} tile
   * @return {number}
   */
  _estimateTextureMemory(tile) {
    // Estimate based on tile dimensions and pixel format
    // Assuming RGBA (4 bytes per pixel) and no compression
    const width = tile.width || 512;
    const height = tile.height || 512;
    // Include mipmaps (adds ~33% more memory)
    return width * height * 4 * 1.33;
  }

  /**
   * Remove all textures from the TextureStore, including pinned textures.
   */
  clear() {
    // Collect list of tiles to be evicted.
    this._evicted.length = 0;
    this._itemMap.forEach((tile) => {
      this._evicted.push(tile);
    });

    // Evict tiles.
    this._evicted.forEach((tile) => {
      this._unloadTile(tile);
    });

    // Clear all internal state.
    this._itemMap.clear();
    this._visible.clear();
    this._previouslyVisible.clear();
    this._pinMap.clear();
    this._newVisible.clear();
    this._noLongerVisible.length = 0;
    this._visibleAgain.length = 0;
    this._evicted.length = 0;
  }

  /**
   * Remove all textures in the TextureStore, excluding unpinned textures.
   */
  clearNotPinned() {
    // Collect list of tiles to be evicted.
    this._evicted.length = 0;
    this._itemMap.forEach((tile) => {
      if (!this._pinMap.has(tile)) {
        this._evicted.push(tile);
      }
    });

    // Evict tiles.
    this._evicted.forEach((tile) => {
      this._unloadTile(tile);
    });

    // Clear all caches except the pinned set.
    this._visible.clear();
    this._previouslyVisible.clear();

    // Clear temporary variables.
    this._evicted.length = 0;
  }

  /**
   * Signal the beginning of a frame. Called from {@link Stage}.
   */
  startFrame() {
    // Check that we are in an appropriate state.
    if (this._state !== State.IDLE && this._state !== State.START) {
      throw new Error('TextureStore: startFrame called out of sequence');
    }

    // Enter the START state, if not already there.
    this._state = State.START;

    // Expect one more endFrame call.
    this._delimCount++;
  }

  /**
   * Mark a tile as visible within the current frame. Called from {@link Stage}.
   * @param {Tile} tile The tile to mark.
   */
  markTile(tile) {
    // Check that we are in an appropriate state.
    if (this._state !== State.START && this._state !== State.MARK) {
      throw new Error('TextureStore: markTile called out of sequence');
    }

    // Enter the MARK state, if not already there.
    this._state = State.MARK;

    // NEW: Update access time for LRU tracking
    this._tileAccessMap.set(tile, Date.now());

    // NEW: Track cache hit/miss for telemetry
    const item = this._itemMap.get(tile);
    if (item && item.texture()) {
      this._tileHitCount++;
    } else {
      this._tileMissCount++;
    }

    // Refresh texture for dynamic assets.
    const texture = item && item.texture();
    const asset = item && item.asset();
    if (texture && asset) {
      texture.refresh(tile, asset);
    }

    // Add tile to the visible set.
    this._newVisible.add(tile);
  }

  /**
   * Signal the end of a frame. Called from {@link Stage}.
   */
  endFrame() {
    // Check that we are in an appropriate state.
    if (this._state !== State.START && this._state !== State.MARK && this._state !== State.END) {
      throw new Error('TextureStore: endFrame called out of sequence');
    }

    // Enter the END state, if not already there.
    this._state = State.END;

    // Expect one less call to endFrame.
    this._delimCount--;

    // If no further calls are expected, process frame and enter the IDLE state.
    if (!this._delimCount) {
      this._update();
      this._state = State.IDLE;
    }
  }

  _update() {
    // Calculate the set of tiles that used to be visible but no longer are.
    this._noLongerVisible.length = 0;
    this._visible.forEach((tile) => {
      if (!this._newVisible.has(tile)) {
        this._noLongerVisible.push(tile);
      }
    });

    // Calculate the set of tiles that were visible recently and have become
    // visible again.
    this._visibleAgain.length = 0;
    this._newVisible.forEach((tile) => {
      if (this._previouslyVisible.has(tile)) {
        this._visibleAgain.push(tile);
      }
    });

    // Remove tiles that have become visible again from the list of previously
    // visible tiles.
    this._visibleAgain.forEach((tile) => {
      this._previouslyVisible.remove(tile);
    });

    // Cancel loading of tiles that are no longer visible.
    // Move no longer visible tiles with a loaded texture into the previously
    // visible set, and collect the tiles evicted from the latter.
    this._evicted.length = 0;
    this._noLongerVisible.forEach((tile) => {
      const item = this._itemMap.get(tile);
      const texture = item && item.texture();
      if (texture) {
        const otherTile = this._previouslyVisible.add(tile);
        if (otherTile != null) {
          this._evicted.push(otherTile);
        }
      } else if (item) {
        this._unloadTile(tile);
      }
    });

    // NEW: Memory-based eviction if over budget
    if (this._enforceMemoryBudget && this._currentGpuMemory > this._maxGpuMemory) {
      this._evictToMeetBudget();
    }

    // Unload evicted tiles, unless they are pinned.
    this._evicted.forEach((tile) => {
      if (!this._pinMap.has(tile)) {
        this._unloadTile(tile);
      }
    });

    // Load visible tiles that are not already in the store.
    // Refresh texture on visible tiles for dynamic assets.
    this._newVisible.forEach((tile) => {
      const item = this._itemMap.get(tile);
      if (!item) {
        this._loadTile(tile);
      }
    });

    // Swap the old visible set with the new one.
    const tmp = this._visible;
    this._visible = this._newVisible;
    this._newVisible = tmp;

    // Clear the new visible set.
    this._newVisible.clear();

    // Clear temporary variables.
    this._noLongerVisible.length = 0;
    this._visibleAgain.length = 0;
    this._evicted.length = 0;
  }

  /**
   * NEW: Evict tiles to meet memory budget
   * @private
   */
  _evictToMeetBudget() {
    // Collect candidates for eviction (unpinned, not visible)
    const candidates = [];
    const currentTime = Date.now();

    this._itemMap.forEach((item, tile) => {
      // Don't evict pinned or currently visible tiles
      if (this._pinMap.has(tile) || this._visible.has(tile)) {
        return;
      }

      const texture = item.texture();
      if (!texture) {
        return; // Skip tiles without loaded textures
      }

      const lastAccess = this._tileAccessMap.get(tile) || 0;
      const timeSinceAccess = currentTime - lastAccess;

      candidates.push({
        tile: tile,
        lastAccess: lastAccess,
        timeSinceAccess: timeSinceAccess,
        memorySize: this._tileMemoryMap.get(tile) || 0,
      });
    });

    // Sort by LRU (oldest access first)
    candidates.sort((a, b) => a.lastAccess - b.lastAccess);

    // Evict tiles until under budget
    for (const candidate of candidates) {
      if (this._currentGpuMemory <= this._maxGpuMemory) {
        break;
      }

      this._evicted.push(candidate.tile);
      this._previouslyVisible.remove(candidate.tile);
    }
  }

  _loadTile(tile) {
    if (this._itemMap.has(tile)) {
      throw new Error('TextureStore: loading texture already in cache');
    }
    const item = new TextureStoreItem(this, tile);
    this._itemMap.set(tile, item);

    // NEW: Track memory usage
    const estimatedMemory = this._estimateTextureMemory(tile);
    this._tileMemoryMap.set(tile, estimatedMemory);
    this._currentGpuMemory += estimatedMemory;
  }

  _unloadTile(tile) {
    const item = this._itemMap.del(tile);
    if (!item) {
      throw new Error('TextureStore: unloading texture not in cache');
    }

    // NEW: Update memory tracking
    const tileMemory = this._tileMemoryMap.get(tile) || 0;
    this._currentGpuMemory -= tileMemory;
    this._tileMemoryMap.del(tile);
    this._tileAccessMap.del(tile);

    item.destroy();
  }

  asset(tile) {
    const item = this._itemMap.get(tile);
    if (item) {
      return item.asset();
    }
    return null;
  }

  texture(tile) {
    const item = this._itemMap.get(tile);
    if (item) {
      return item.texture();
    }
    return null;
  }

  /**
   * Pin a tile. Textures for pinned tiles are never evicted from the store.
   * Upon pinning, the texture is created if not already present. Pins are
   * reference-counted; a tile may be pinned multiple times and must be unpinned
   * the corresponding number of times. Pinning is useful e.g. to ensure that
   * the lowest-resolution level of an image is always available to fall back
   * onto.
   * @param {Tile} tile the tile to pin
   * @returns {number} the pin reference count.
   */
  pin(tile) {
    // Increment reference count.
    const count = (this._pinMap.get(tile) || 0) + 1;
    this._pinMap.set(tile, count);
    // If the texture for the tile is not present, load it now.
    if (!this._itemMap.has(tile)) {
      this._loadTile(tile);
    }
    return count;
  }

  /**
   * Unpin a tile. Pins are reference-counted; a tile may be pinned multiple
   * times and must be unpinned the corresponding number of times.
   * @param {Tile} tile the tile to unpin
   * @returns {number} the pin reference count.
   */
  unpin(tile) {
    let count = this._pinMap.get(tile);
    // Consistency check.
    if (!count) {
      throw new Error('TextureStore: unpin when not pinned');
    } else {
      // Decrement reference count.
      count--;
      if (count > 0) {
        this._pinMap.set(tile, count);
      } else {
        this._pinMap.del(tile);
        // If the tile does not belong to either the visible or previously
        // visible sets, evict it from the cache.
        if (!this._visible.has(tile) && !this._previouslyVisible.has(tile)) {
          this._unloadTile(tile);
        }
      }
    }
    return count;
  }

  /**
   * Return type for {@link TextureStore#query}.
   * @typedef {Object} TileState
   * @property {boolean} visible Whether the tile is in the visible set.
   * @property {boolean} previouslyVisible Whether the tile is in the previously
   *     visible set.
   * @property {boolean} hasAsset Whether the asset for the tile is present.
   * @property {boolean} hasTexture Whether the texture for the tile is present.
   * @property {boolean} pinned Whether the tile is in the pinned set.
   * @property {number} pinCount The pin reference count for the tile.
   */

  /**
   * Return the state of a tile.
   * @param {Tile} tile The tile to query.
   * @return {TileState}
   */
  query(tile) {
    const item = this._itemMap.get(tile);
    const pinCount = this._pinMap.get(tile) || 0;
    return {
      visible: this._visible.has(tile),
      previouslyVisible: this._previouslyVisible.has(tile),
      hasAsset: item != null && item.asset() != null,
      hasTexture: item != null && item.texture() != null,
      pinned: pinCount !== 0,
      pinCount: pinCount,
    };
  }
}

eventEmitter(TextureStore);

export default TextureStore;
