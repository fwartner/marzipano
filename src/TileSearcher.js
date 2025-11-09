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

import Set from './collections/Set.js';

/**
 * @class TileSearcher
 * @classdesc
 *
 * A TileSearcher performs searches for visible tiles.
 */
class TileSearcher {
  constructor() {
    // Stack of tiles to be explored.
    this._stack = [];

    // Set of already explored tiles.
    this._visited = new Set();

    // Tile vertices. Allocated by Tile#vertices on first use.
    this._vertices = null;
  }

  /**
   * Performs a search for visible tiles by starting at a given tile and
   * recursively exploring neighbors until no more visible tiles are found.
   *
   * @param {View} view The view used to deem whether a tile is visible.
   * @param {Tile} tile The starting tile.
   * @param {Tile[]} result An array to append the visible tiles to, including the
   *     starting tile when visible. Existing array members are preserved.
   * @return {number} The number of visible tiles found.
   */
  search(view, startingTile, result) {
    const stack = this._stack;
    const visited = this._visited;
    const vertices = this._vertices;

    let count = 0;

    // Clear internal state.
    this._clear();

    stack.push(startingTile);

    while (stack.length > 0) {
      const tile = stack.pop();

      if (visited.has(tile)) {
        // Skip already visited tile.
        continue;
      }

      if (!view.intersects(tile.vertices(vertices))) {
        // Skip non-visible tile.
        continue;
      }

      // Mark tile as visited.
      visited.add(tile);

      // Add neighbors to the stack of tiles to explore.
      const neighbors = tile.neighbors();
      for (let i = 0; i < neighbors.length; i++) {
        stack.push(neighbors[i]);
      }

      // Add to result.
      result.push(tile);

      count++;
    }

    // Reuse the vertices array in future searches.
    this._vertices = vertices;

    // Clear internal state.
    this._clear();

    return count;
  }

  _clear() {
    this._stack.length = 0;
    this._visited.clear();
  }
}

export default TileSearcher;
