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
import cmp from '../util/cmp.js';
import type from '../util/type.js';

import { makeLevelList } from './common.js';
import { makeSelectableLevelList } from './common.js';

import { vec3 } from 'gl-matrix';
import { vec4 } from 'gl-matrix';

const neighborsCacheSize = 64;

// Initials for cube faces.
const faceList = 'fudlrb';

// Rotation of each face, relative to the front face.
const faceRotation = {
  f: { x: 0, y: 0 },
  b: { x: 0, y: Math.PI },
  l: { x: 0, y: Math.PI / 2 },
  r: { x: 0, y: -Math.PI / 2 },
  u: { x: Math.PI / 2, y: 0 },
  d: { x: -Math.PI / 2, y: 0 },
};

// Zero vector.
const origin = vec3.create();

// Rotate a vector in ZXY order.
function rotateVector(vec, z, x, y) {
  if (z) {
    vec3.rotateZ(vec, vec, origin, z);
  }
  if (x) {
    vec3.rotateX(vec, vec, origin, x);
  }
  if (y) {
    vec3.rotateY(vec, vec, origin, y);
  }
}

// Normalized vectors pointing to the center of each face.
const faceVectors = {};
for (let i = 0; i < faceList.length; i++) {
  const face = faceList[i];
  const rotation = faceRotation[face];
  const v = vec3.fromValues(0, 0, -1);
  rotateVector(v, 0, rotation.x, rotation.y);
  faceVectors[face] = v;
}

// Map each face to its adjacent faces.
// The order is as suggested by the front face.
const adjacentFace = {
  f: ['l', 'r', 'u', 'd'],
  b: ['r', 'l', 'u', 'd'],
  l: ['b', 'f', 'u', 'd'],
  r: ['f', 'b', 'u', 'd'],
  u: ['l', 'r', 'b', 'f'],
  d: ['l', 'r', 'f', 'b'],
};

// Offsets to apply to the (x,y) coordinates of a tile to get its neighbors.
const neighborOffsets = [
  [0, 1], // top
  [1, 0], // right
  [0, -1], // bottom
  [-1, 0], // left
];

/**
 * @class CubeTile
 * @implements Tile
 * @classdesc
 *
 * A tile in a @{CubeGeometry}.
 */
function CubeTile(face, x, y, z, geometry) {
  this.face = face;
  this.x = x;
  this.y = y;
  this.z = z;
  this._geometry = geometry;
  this._level = geometry.levelList[z];
}

CubeTile.prototype.rotX = function () {
  return faceRotation[this.face].x;
};

CubeTile.prototype.rotY = function () {
  return faceRotation[this.face].y;
};

CubeTile.prototype.centerX = function () {
  return (this.x + 0.5) / this._level.numHorizontalTiles() - 0.5;
};

CubeTile.prototype.centerY = function () {
  return 0.5 - (this.y + 0.5) / this._level.numVerticalTiles();
};

CubeTile.prototype.scaleX = function () {
  return 1 / this._level.numHorizontalTiles();
};

CubeTile.prototype.scaleY = function () {
  return 1 / this._level.numVerticalTiles();
};

CubeTile.prototype.vertices = function (result) {
  if (!result) {
    result = [vec3.create(), vec3.create(), vec3.create(), vec3.create()];
  }

  const rot = faceRotation[this.face];

  function makeVertex(vec, x, y) {
    vec3.set(vec, x, y, -0.5);
    rotateVector(vec, 0, rot.x, rot.y);
  }

  const left = this.centerX() - this.scaleX() / 2;
  const right = this.centerX() + this.scaleX() / 2;
  const bottom = this.centerY() - this.scaleY() / 2;
  const top = this.centerY() + this.scaleY() / 2;

  makeVertex(result[0], left, top);
  makeVertex(result[1], right, top);
  makeVertex(result[2], right, bottom);
  makeVertex(result[3], left, bottom);

  return result;
};

CubeTile.prototype.parent = function () {
  if (this.z === 0) {
    return null;
  }

  const face = this.face;
  const z = this.z;
  const x = this.x;
  const y = this.y;

  const geometry = this._geometry;
  const level = geometry.levelList[z];
  const parentLevel = geometry.levelList[z - 1];

  const tileX = Math.floor((x / level.numHorizontalTiles()) * parentLevel.numHorizontalTiles());
  const tileY = Math.floor((y / level.numVerticalTiles()) * parentLevel.numVerticalTiles());
  const tileZ = z - 1;

  return new CubeTile(face, tileX, tileY, tileZ, geometry);
};

CubeTile.prototype.children = function (result) {
  if (this.z === this._geometry.levelList.length - 1) {
    return null;
  }

  const face = this.face;
  const z = this.z;
  const x = this.x;
  const y = this.y;

  const geometry = this._geometry;
  const level = geometry.levelList[z];
  const childLevel = geometry.levelList[z + 1];

  const nHoriz = childLevel.numHorizontalTiles() / level.numHorizontalTiles();
  const nVert = childLevel.numVerticalTiles() / level.numVerticalTiles();

  result = result || [];

  for (let h = 0; h < nHoriz; h++) {
    for (let v = 0; v < nVert; v++) {
      const tileX = nHoriz * x + h;
      const tileY = nVert * y + v;
      const tileZ = z + 1;
      result.push(new CubeTile(face, tileX, tileY, tileZ, geometry));
    }
  }

  return result;
};

CubeTile.prototype.neighbors = function () {
  const geometry = this._geometry;
  const cache = geometry._neighborsCache;

  // Satisfy from cache when available.
  const cachedResult = cache.get(this);
  if (cachedResult) {
    return cachedResult;
  }

  const vec = geometry._vec;

  const face = this.face;
  const x = this.x;
  const y = this.y;
  const z = this.z;
  const level = this._level;

  const numX = level.numHorizontalTiles();
  const numY = level.numVerticalTiles();

  const result = [];

  for (let i = 0; i < neighborOffsets.length; i++) {
    const xOffset = neighborOffsets[i][0];
    const yOffset = neighborOffsets[i][1];

    let newX = x + xOffset;
    let newY = y + yOffset;
    const newZ = z;
    let newFace = face;

    if (newX < 0 || newX >= numX || newY < 0 || newY >= numY) {
      // If the neighboring tile belongs to a different face, calculate a
      // vector pointing to the edge between the two faces at the point the
      // tile and its neighbor meet, and convert it into tile coordinates for
      // the neighboring face.

      const xCoord = this.centerX();
      const yCoord = this.centerY();

      // First, calculate the vector as if the initial tile belongs to the
      // front face, so that the tile x,y coordinates map directly into the
      // x,y axes.

      if (newX < 0) {
        vec3.set(vec, -0.5, yCoord, -0.5);
        newFace = adjacentFace[face][0];
      } else if (newX >= numX) {
        vec3.set(vec, 0.5, yCoord, -0.5);
        newFace = adjacentFace[face][1];
      } else if (newY < 0) {
        vec3.set(vec, xCoord, 0.5, -0.5);
        newFace = adjacentFace[face][2];
      } else if (newY >= numY) {
        vec3.set(vec, xCoord, -0.5, -0.5);
        newFace = adjacentFace[face][3];
      }

      let rot;

      // Then, rotate the vector into the actual face the initial tile
      // belongs to.

      rot = faceRotation[face];
      rotateVector(vec, 0, rot.x, rot.y);

      // Finally, rotate the vector from the neighboring face into the front
      // face. Again, this is so that the neighboring tile x,y coordinates
      // map directly into the x,y axes.

      rot = faceRotation[newFace];
      rotateVector(vec, 0, -rot.x, -rot.y);

      // Calculate the neighboring tile coordinates.

      newX = clamp(Math.floor((0.5 + vec[0]) * numX), 0, numX - 1);
      newY = clamp(Math.floor((0.5 - vec[1]) * numY), 0, numY - 1);
    }

    result.push(new CubeTile(newFace, newX, newY, newZ, geometry));
  }

  // Store into cache to satisfy future requests.
  cache.set(this, result);

  return result;
};

CubeTile.prototype.hash = function () {
  return hash(faceList.indexOf(this.face), this.z, this.y, this.x);
};

CubeTile.prototype.equals = function (that) {
  return (
    this._geometry === that._geometry &&
    this.face === that.face &&
    this.z === that.z &&
    this.y === that.y &&
    this.x === that.x
  );
};

CubeTile.prototype.cmp = function (that) {
  return (
    cmp(this.z, that.z) ||
    cmp(faceList.indexOf(this.face), faceList.indexOf(that.face)) ||
    cmp(this.y, that.y) ||
    cmp(this.x, that.x)
  );
};

CubeTile.prototype.str = function () {
  return `CubeTile(${this.face}, ${this.x}, ${this.y}, ${this.z})`;
};

function CubeLevel(levelProperties) {
  this.constructor.super_.call(this, levelProperties);

  this._size = levelProperties.size;
  this._tileSize = levelProperties.tileSize;

  if (this._size % this._tileSize !== 0) {
    throw new Error(
      `Level size is not multiple of tile size: ${this}`._size + ` ${this}`._tileSize
    );
  }
}

inherits(CubeLevel, Level);

CubeLevel.prototype.width = function () {
  return this._size;
};

CubeLevel.prototype.height = function () {
  return this._size;
};

CubeLevel.prototype.tileWidth = function () {
  return this._tileSize;
};

CubeLevel.prototype.tileHeight = function () {
  return this._tileSize;
};

CubeLevel.prototype._validateWithParentLevel = function (parentLevel) {
  const width = this.width();
  const height = this.height();
  const tileWidth = this.tileWidth();
  const tileHeight = this.tileHeight();
  const numHorizontal = this.numHorizontalTiles();
  const numVertical = this.numVerticalTiles();

  const parentWidth = parentLevel.width();
  const parentHeight = parentLevel.height();
  const parentTileWidth = parentLevel.tileWidth();
  const parentTileHeight = parentLevel.tileHeight();
  const parentNumHorizontal = parentLevel.numHorizontalTiles();
  const parentNumVertical = parentLevel.numVerticalTiles();

  if (width % parentWidth !== 0) {
    throw new Error(`Level width must be multiple of parent level: ${width} vs. ${  parentWidth}`);
  }

  if (height % parentHeight !== 0) {
    throw new Error(`Level height must be multiple of parent level: ${height} vs. ${  parentHeight}`);
  }

  if (numHorizontal % parentNumHorizontal !== 0) {
    throw new Error(
      `Number of horizontal tiles must be multiple of parent level: ${ 
        numHorizontal 
        } (${ 
        width 
        }/${tileWidth})` +
        ` vs. ${ 
        parentNumHorizontal 
        } (${ 
        parentWidth 
        }/${parentTileWidth})`
    );
  }

  if (numVertical % parentNumVertical !== 0) {
    throw new Error(
      `Number of vertical tiles must be multiple of parent level: ${ 
        numVertical 
        } (${ 
        height 
        }/${tileHeight})` +
        ` vs. ${ 
        parentNumVertical 
        } (${ 
        parentHeight 
        }/${parentTileHeight})`
    );
  }
};

/**
 * @class CubeGeometry
 * @implements Geometry
 * @classdesc
 *
 * A {@link Geometry} implementation suitable for tiled cube images with
 * multiple resolution levels.
 *
 * The following restrictions apply:
 *   - All tiles in a level must be square and form a rectangular grid;
 *   - The size of a level must be a multiple of the tile size;
 *   - The size of a level must be a multiple of the parent level size;
 *   - The number of tiles in a level must be a multiple of the number of tiles
 *     in the parent level.
 *
 * @param {Object[]} levelPropertiesList Level description
 * @param {number} levelPropertiesList[].size Cube face size in pixels
 * @param {number} levelPropertiesList[].tileSize Tile size in pixels
 */
function CubeGeometry(levelPropertiesList) {
  if (type(levelPropertiesList) !== 'array') {
    throw new Error('Level list must be an array');
  }

  this.levelList = makeLevelList(levelPropertiesList, CubeLevel);
  this.selectableLevelList = makeSelectableLevelList(this.levelList);

  for (let i = 1; i < this.levelList.length; i++) {
    this.levelList[i]._validateWithParentLevel(this.levelList[i - 1]);
  }

  this._tileSearcher = new TileSearcher(this);

  this._neighborsCache = new LruMap(neighborsCacheSize);

  this._vec = vec4.create();

  this._viewSize = {};
}

CubeGeometry.prototype.maxTileSize = function () {
  let maxTileSize = 0;
  for (let i = 0; i < this.levelList.length; i++) {
    const level = this.levelList[i];
    maxTileSize = Math.max(maxTileSize, level.tileWidth, level.tileHeight);
  }
  return maxTileSize;
};

CubeGeometry.prototype.levelTiles = function (level, result) {
  const levelIndex = this.levelList.indexOf(level);
  const maxX = level.numHorizontalTiles() - 1;
  const maxY = level.numVerticalTiles() - 1;

  result = result || [];

  for (let f = 0; f < faceList.length; f++) {
    const face = faceList[f];
    for (let x = 0; x <= maxX; x++) {
      for (let y = 0; y <= maxY; y++) {
        result.push(new CubeTile(face, x, y, levelIndex, this));
      }
    }
  }

  return result;
};

CubeGeometry.prototype._closestTile = function (view, level) {
  const ray = this._vec;

  // Compute a view ray into the central screen point.
  vec4.set(ray, 0, 0, 1, 1);
  vec4.transformMat4(ray, ray, view.inverseProjection());

  let minAngle = Infinity;
  let closestFace = null;

  // Find the face whose vector makes a minimal angle with the view ray.
  // This is the face into which the view ray points.
  for (const face in faceVectors) {
    const vector = faceVectors[face];
    // For a small angle between two normalized vectors, angle ~ 1-cos(angle).
    const angle = 1 - vec3.dot(vector, ray);
    if (angle < minAngle) {
      minAngle = angle;
      closestFace = face;
    }
  }

  // Project view ray onto cube, i.e., normalize the coordinate with
  // largest absolute value to ±0.5.
  const max = Math.max(Math.abs(ray[0]), Math.abs(ray[1]), Math.abs(ray[2])) / 0.5;
  for (let i = 0; i < 3; i++) {
    ray[i] = ray[i] / max;
  }

  // Rotate view ray into front face.
  const rot = faceRotation[closestFace];
  rotateVector(ray, 0, -rot.x, -rot.y);

  // Get the desired zoom level.
  const tileZ = this.levelList.indexOf(level);
  const numX = level.numHorizontalTiles();
  const numY = level.numVerticalTiles();

  // Find the coordinates of the tile that the view ray points into.
  const tileX = clamp(Math.floor((0.5 + ray[0]) * numX), 0, numX - 1);
  const tileY = clamp(Math.floor((0.5 - ray[1]) * numY), 0, numY - 1);

  return new CubeTile(closestFace, tileX, tileY, tileZ, this);
};

CubeGeometry.prototype.visibleTiles = function (view, level, result) {
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

CubeGeometry.Tile = CubeGeometry.prototype.Tile = CubeTile;
CubeGeometry.type = CubeGeometry.prototype.type = 'cube';
CubeTile.type = CubeTile.prototype.type = 'cube';

export default CubeGeometry;
