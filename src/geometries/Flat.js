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


import inherits from '../util/inherits.js';
import hash from '../util/hash.js';
import TileSearcher from '../TileSearcher.js';
import LruMap from '../collections/LruMap.js';
import Level from './Level.js';
import clamp from '../util/clamp.js';
import mod from '../util/mod.js';
import cmp from '../util/cmp.js';
import type from '../util/type.js';

import { makeLevelList } from './common.js';
import { makeSelectableLevelList } from './common.js';

import { vec2 } from 'gl-matrix';
import { vec4 } from 'gl-matrix';

const neighborsCacheSize = 64;

// Offsets to apply to the (x,y) coordinates of a tile to get its neighbors.
const neighborOffsets = [
  [  0,  1 ], // top
  [  1,  0 ], // right
  [  0, -1 ], // bottom
  [ -1,  0 ]  // left
];

/**
 * @class FlatTile
 * @implements Tile
 * @classdesc
 *
 * A tile in a {@link FlatGeometry}.
 */
function FlatTile(x, y, z, geometry) {
  this.x = x;
  this.y = y;
  this.z = z;
  this._geometry = geometry;
  this._level = geometry.levelList[z];
}

FlatTile.prototype.rotX = function() {
  return 0;
};

FlatTile.prototype.rotY = function() {
  return 0;
};

FlatTile.prototype.centerX = function() {
  let levelWidth = this._level.width();
  let tileWidth = this._level.tileWidth();
  return (this.x * tileWidth + 0.5 * this.width()) / levelWidth - 0.5;
};

FlatTile.prototype.centerY = function() {
  let levelHeight = this._level.height();
  let tileHeight = this._level.tileHeight();
  return 0.5 - (this.y * tileHeight + 0.5 * this.height()) / levelHeight;
};

FlatTile.prototype.scaleX = function() {
  let levelWidth = this._level.width();
  return this.width() / levelWidth;
};

FlatTile.prototype.scaleY = function() {
  let levelHeight = this._level.height();
  return this.height() / levelHeight;
};

FlatTile.prototype.width = function() {
  let levelWidth = this._level.width();
  let tileWidth = this._level.tileWidth();
  if (this.x === this._level.numHorizontalTiles() - 1) {
    const widthRemainder = mod(levelWidth, tileWidth);
    return widthRemainder || tileWidth;
  } else {
    return tileWidth;
  }
};

FlatTile.prototype.height = function() {
  let levelHeight = this._level.height();
  let tileHeight = this._level.tileHeight();
  if (this.y === this._level.numVerticalTiles() - 1) {
    const heightRemainder = mod(levelHeight, tileHeight);
    return heightRemainder || tileHeight;
  } else {
    return tileHeight;
  }
};

FlatTile.prototype.levelWidth = function() {
  return this._level.width();
};

FlatTile.prototype.levelHeight = function() {
  return this._level.height();
};

FlatTile.prototype.vertices = function(result) {
  if (!result) {
    result = [vec2.create(), vec2.create(), vec2.create(), vec2.create()];
  }

  const left = this.centerX() - this.scaleX() / 2;
  const right = this.centerX() + this.scaleX() / 2;
  const bottom = this.centerY() - this.scaleY() / 2;
  const top = this.centerY() + this.scaleY() / 2;

  vec2.set(result[0], left, top);
  vec2.set(result[1], right, top);
  vec2.set(result[2], right, bottom);
  vec2.set(result[3], left, bottom);

  return result;
};

FlatTile.prototype.parent = function() {

  if (this.z === 0) {
    return null;
  }

  let geometry = this._geometry;

  let z = this.z - 1;
  // TODO: Currently assuming each level is double the size of previous one.
  // Fix to support other multiples.
  let x = Math.floor(this.x / 2);
  let y = Math.floor(this.y / 2);

  return new FlatTile(x, y, z, geometry);

};

FlatTile.prototype.children = function(result) {
  if (this.z === this._geometry.levelList.length - 1) {
    return null;
  }

  let geometry = this._geometry;
  let z = this.z + 1;

  result = result || [];

  // TODO: Currently assuming each level is double the size of previous one.
  // Fix to support other multiples.
  result.push(new FlatTile(2*this.x  , 2*this.y  , z, geometry));
  result.push(new FlatTile(2*this.x  , 2*this.y+1, z, geometry));
  result.push(new FlatTile(2*this.x+1, 2*this.y  , z, geometry));
  result.push(new FlatTile(2*this.x+1, 2*this.y+1, z, geometry));

  return result;

};

FlatTile.prototype.neighbors = function() {

  const geometry = this._geometry;
  const cache = geometry._neighborsCache;

  // Satisfy from cache when available.
  const cachedResult = cache.get(this);
  if (cachedResult) {
    return cachedResult;
  }

  let x = this.x;
  let y = this.y;
  const z = this.z;
  let level = this._level;

  let numX = level.numHorizontalTiles() - 1;
  let numY = level.numVerticalTiles() - 1;

  let result = [];

  for (let i = 0; i < neighborOffsets.length; i++) {
    const xOffset = neighborOffsets[i][0];
    const yOffset = neighborOffsets[i][1];

    const newX = x + xOffset;
    const newY = y + yOffset;
    const newZ = z;

    if (0 <= newX && newX <= numX && 0 <= newY && newY <= numY) {
      result.push(new FlatTile(newX, newY, newZ, geometry));
    }
  }

  // Store into cache to satisfy future requests.
  cache.set(this, result);

  return result;

};

FlatTile.prototype.hash = function() {
  return hash(this.z, this.y, this.x);
};

FlatTile.prototype.equals = function(that) {
  return (this._geometry === that._geometry &&
      this.z === that.z && this.y === that.y && this.x === that.x);
};

FlatTile.prototype.cmp = function(that) {
  return (cmp(this.z, that.z) || cmp(this.y, that.y) || cmp(this.x, that.x));
};

FlatTile.prototype.str = function() {
  return `FlatTile(${this.x}, ${this.y}, ${this.z})`;
};

function FlatLevel(levelProperties) {
  this.constructor.super_.call(this, levelProperties);

  this._width = levelProperties.width;
  this._height = levelProperties.height;
  this._tileWidth = levelProperties.tileWidth;
  this._tileHeight = levelProperties.tileHeight;
}

inherits(FlatLevel, Level);

FlatLevel.prototype.width = function() {
  return this._width;
};

FlatLevel.prototype.height = function() {
  return this._height;
};

FlatLevel.prototype.tileWidth = function() {
  return this._tileWidth;
};

FlatLevel.prototype.tileHeight = function() {
  return this._tileHeight;
};

FlatLevel.prototype._validateWithParentLevel = function(parentLevel) {

  const width = this.width();
  const height = this.height();
  let tileWidth = this.tileWidth();
  let tileHeight = this.tileHeight();

  const parentWidth = parentLevel.width();
  const parentHeight = parentLevel.height();
  const parentTileWidth = parentLevel.tileWidth();
  const parentTileHeight = parentLevel.tileHeight();

  if (width % parentWidth !== 0) {
    return new Error(`Level width must be multiple of parent level: ${width} vs. ` + parentWidth);
  }

  if (height % parentHeight !== 0) {
    return new Error(`Level height must be multiple of parent level: ${height} vs. ` + parentHeight);
  }

  if (tileWidth % parentTileWidth !== 0) {
    return new Error(`Level tile width must be multiple of parent level: ${tileWidth} vs. ` + parentTileWidth);
  }

  if (tileHeight % parentTileHeight !== 0) {
    return new Error(`Level tile height must be multiple of parent level: ${tileHeight} vs. ` + parentTileHeight);
  }

};

/**
 * @class FlatGeometry
 * @implements Geometry
 * @classdesc
 *
 * A {@link Geometry} implementation suitable for tiled flat images with
 * multiple resolution levels.
 *
 * The following restrictions apply:
 *   - All tiles must be square, except when in the last row or column position,
 *     and must form a rectangular grid;
 *   - The width and height of a level must be multiples of the parent level
 *     width and height.
 *
 * @param {Object[]} levelPropertiesList Level description
 * @param {number} levelPropertiesList[].width Level width in pixels
 * @param {number} levelPropertiesList[].tileWidth Tile width in pixels for
 *                 square tiles
 * @param {number} levelPropertiesList[].height Level height in pixels
 * @param {number} levelPropertiesList[].tileHeight Tile height in pixels for
 *                 square tiles
 */
function FlatGeometry(levelPropertiesList) {
  if (type(levelPropertiesList) !== 'array') {
    throw new Error('Level list must be an array');
  }

  this.levelList = makeLevelList(levelPropertiesList, FlatLevel);
  this.selectableLevelList = makeSelectableLevelList(this.levelList);

  for (let i = 1; i < this.levelList.length; i++) {
    this.levelList[i]._validateWithParentLevel(this.levelList[i-1]);
  }

  this._tileSearcher = new TileSearcher(this);

  this._neighborsCache = new LruMap(neighborsCacheSize);

  this._vec = vec4.create();

  this._viewSize = {};
}

FlatGeometry.prototype.maxTileSize = function() {
  let maxTileSize = 0;
  for (const i = 0; i < this.levelList.length; i++) {
    const level = this.levelList[i];
    maxTileSize = Math.max(maxTileSize, level.tileWidth, level.tileHeight);
  }
  return maxTileSize;
};

FlatGeometry.prototype.levelTiles = function(level, result) {

  const levelIndex = this.levelList.indexOf(level);
  const maxX = level.numHorizontalTiles() - 1;
  const maxY = level.numVerticalTiles() - 1;

  if (!result) {
    result = [];
  }

  for (let x = 0; x <= maxX; x++) {
    for (let y = 0; y <= maxY; y++) {
      result.push(new FlatTile(x, y, levelIndex, this));
    }
  }

  return result;

};

FlatGeometry.prototype._closestTile = function(view, level) {
  const ray = this._vec;

  // Compute a view ray into the central screen point.
  vec4.set(ray, 0, 0, 1, 1);
  vec4.transformMat4(ray, ray, view.inverseProjection());

  // Compute the image coordinates that the view ray points into.
  const x = 0.5 + ray[0];
  const y = 0.5 - ray[1];

  // Get the desired zoom level.
  const tileZ = this.levelList.indexOf(level);
  const levelWidth = level.width();
  const levelHeight = level.height();
  const tileWidth = level.tileWidth();
  const tileHeight = level.tileHeight();
  const numX = level.numHorizontalTiles();
  const numY = level.numVerticalTiles();

  // Find the coordinates of the tile that the view ray points into.
  const tileX = clamp(Math.floor(x * levelWidth / tileWidth), 0, numX - 1);
  const tileY = clamp(Math.floor(y * levelHeight / tileHeight), 0, numY - 1);

  return new FlatTile(tileX, tileY, tileZ, this);
};

FlatGeometry.prototype.visibleTiles = function(view, level, result) {
  const viewSize = this._viewSize;
  const tileSearcher = this._tileSearcher;

  result = result || [];

  view.size(viewSize);
  if (viewSize.width === 0 || viewSize.height === 0) {
    // No tiles are visible if the viewport is empty.
    return result;
  }

  const startingTile = this._closestTile(view, level);
  const count = tileSearcher.search(view, startingTile, result);
  if (!count) {
    throw new Error('Starting tile is not visible');
  }

  return result;
};

FlatGeometry.Tile = FlatGeometry.prototype.Tile = FlatTile;
FlatGeometry.type = FlatGeometry.prototype.type = 'flat';
FlatTile.type = FlatTile.prototype.type = 'flat';

export default FlatGeometry;
