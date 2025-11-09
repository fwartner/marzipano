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


import clearOwnProperties from '../util/clearOwnProperties.js';
import WebGlCommon from './WebGlCommon.js';
import vertexSrc from '../shaders/vertexNormal.js';
import fragmentSrc from '../shaders/fragmentNormal.js';

import { mat4 } from 'gl-matrix';
import { vec3 } from 'gl-matrix';

const createConstantBuffers = WebGlCommon.createConstantBuffers;
const destroyConstantBuffers = WebGlCommon.destroyConstantBuffers;
const createShaderProgram = WebGlCommon.createShaderProgram;
const destroyShaderProgram = WebGlCommon.destroyShaderProgram;
const enableAttributes = WebGlCommon.enableAttributes;
const disableAttributes = WebGlCommon.disableAttributes;
const setViewport = WebGlCommon.setViewport;
const setupPixelEffectUniforms = WebGlCommon.setupPixelEffectUniforms;

const setDepth = WebGlCommon.setDepth;
const setTexture = WebGlCommon.setTexture;

const vertexIndices = [0, 1, 2, 0, 2, 3];
const vertexPositions = [-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 0.0];
const textureCoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];

const attribList = ['aVertexPosition', 'aTextureCoord'];
const uniformList = [
  'uDepth', 'uOpacity', 'uSampler', 'uProjMatrix', 'uViewportMatrix',
  'uColorOffset', 'uColorMatrix'
];

function WebGlBaseRenderer(gl) {
  this.gl = gl;

  // The projection matrix positions the tiles in world space.
  // We compute it in Javascript because lack of precision in the vertex shader
  // causes seams to appear between adjacent tiles at large zoom levels.
  this.projMatrix = mat4.create();

  // The viewport matrix responsible for viewport clamping.
  // See setViewport() for an explanation of how it works.
  this.viewportMatrix = mat4.create();

  // Translation and scale vectors for tiles.
  this.translateVector = vec3.create();
  this.scaleVector = vec3.create();

  this.constantBuffers = createConstantBuffers(gl, vertexIndices, vertexPositions, textureCoords);

  this.shaderProgram = createShaderProgram(gl, vertexSrc, fragmentSrc, attribList, uniformList);
}

WebGlBaseRenderer.prototype.destroy = function() {
  destroyConstantBuffers(this.gl, this.constantBuffers);
  destroyShaderProgram(this.gl, this.shaderProgram);
  clearOwnProperties(this);
};

WebGlBaseRenderer.prototype.startLayer = function(layer, rect) {
  let gl = this.gl;
  let shaderProgram = this.shaderProgram;
  let constantBuffers = this.constantBuffers;
  const viewportMatrix = this.viewportMatrix;

  gl.useProgram(shaderProgram);

  enableAttributes(gl, shaderProgram);

  setViewport(gl, layer, rect, viewportMatrix);
  gl.uniformMatrix4fv(shaderProgram.uViewportMatrix, false, viewportMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.vertexPositions);
  gl.vertexAttribPointer(shaderProgram.aVertexPosition, 3, gl.FLOAT, gl.FALSE, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.textureCoords);
  gl.vertexAttribPointer(shaderProgram.aTextureCoord, 2, gl.FLOAT, gl.FALSE, 0, 0);

  setupPixelEffectUniforms(gl, layer.effects(), {
    opacity: shaderProgram.uOpacity,
    colorOffset: shaderProgram.uColorOffset,
    colorMatrix: shaderProgram.uColorMatrix
  });
};

WebGlBaseRenderer.prototype.endLayer = function(layer, rect) {
  let gl = this.gl;
  let shaderProgram = this.shaderProgram;
  disableAttributes(gl, shaderProgram);
};

WebGlBaseRenderer.prototype.renderTile = function(tile, texture, layer, layerZ) {
  const gl = this.gl;
  const shaderProgram = this.shaderProgram;
  const constantBuffers = this.constantBuffers;
  const projMatrix = this.projMatrix;
  const translateVector = this.translateVector;
  const scaleVector = this.scaleVector;

  translateVector[0] = tile.centerX();
  translateVector[1] = tile.centerY();
  translateVector[2] = -0.5;

  scaleVector[0] = tile.scaleX();
  scaleVector[1] = tile.scaleY();
  scaleVector[2] = 1.0;

  mat4.copy(projMatrix, layer.view().projection());
  mat4.rotateX(projMatrix, projMatrix, tile.rotX());
  mat4.rotateY(projMatrix, projMatrix, tile.rotY());
  mat4.translate(projMatrix, projMatrix, translateVector);
  mat4.scale(projMatrix, projMatrix, scaleVector);

  gl.uniformMatrix4fv(shaderProgram.uProjMatrix, false, projMatrix);

  setDepth(gl, shaderProgram, layerZ, tile.z);

  setTexture(gl, shaderProgram, texture);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, constantBuffers.vertexIndices);
  gl.drawElements(gl.TRIANGLES, vertexIndices.length, gl.UNSIGNED_SHORT, 0);
};

export default WebGlBaseRenderer;
