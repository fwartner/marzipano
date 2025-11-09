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
import vertexSrc from '../shaders/vertexEquirect.js';
import fragmentSrc from '../shaders/fragmentEquirect.js';

import { mat4 } from 'gl-matrix';

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
const vertexPositions = [-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0];
const textureCoords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];

const attribList = ['aVertexPosition'];
const uniformList = [
  'uDepth',
  'uOpacity',
  'uSampler',
  'uInvProjMatrix',
  'uViewportMatrix',
  'uColorOffset',
  'uColorMatrix',
  'uTextureX',
  'uTextureY',
  'uTextureWidth',
  'uTextureHeight',
];

/**
 * @class WebGlEquirectRenderer
 * @implements Renderer
 * @classdesc
 *
 * A renderer for {@link EquirectGeometry} and {@link RectilinearView},
 * appropriate for {@link WebGlStage}.
 *
 * Most users do not need to instantiate this class. Renderers are created and
 * destroyed by {@link Stage} as necessary.
 */
function WebGlEquirectRenderer(gl) {
  this.gl = gl;

  // The inverse projection matrix.
  this.invProjMatrix = mat4.create();

  // The viewport matrix responsible for viewport clamping.
  // See setViewport() for an explanation of how it works.
  this.viewportMatrix = mat4.create();

  this.constantBuffers = createConstantBuffers(gl, vertexIndices, vertexPositions, textureCoords);

  this.shaderProgram = createShaderProgram(gl, vertexSrc, fragmentSrc, attribList, uniformList);
}

WebGlEquirectRenderer.prototype.destroy = function () {
  destroyConstantBuffers(this.gl, this.constantBuffers);
  destroyShaderProgram(this.gl, this.shaderProgram);
  clearOwnProperties(this);
};

WebGlEquirectRenderer.prototype.startLayer = function (layer, rect) {
  const gl = this.gl;
  const shaderProgram = this.shaderProgram;
  const constantBuffers = this.constantBuffers;
  const invProjMatrix = this.invProjMatrix;
  const viewportMatrix = this.viewportMatrix;

  gl.useProgram(shaderProgram);

  enableAttributes(gl, shaderProgram);

  setViewport(gl, layer, rect, viewportMatrix);
  gl.uniformMatrix4fv(shaderProgram.uViewportMatrix, false, viewportMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.vertexPositions);
  gl.vertexAttribPointer(shaderProgram.aVertexPosition, 3, gl.FLOAT, gl.FALSE, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, constantBuffers.textureCoords);

  // Compute and set the inverse projection matrix.
  mat4.copy(invProjMatrix, layer.view().projection());
  mat4.invert(invProjMatrix, invProjMatrix);

  gl.uniformMatrix4fv(shaderProgram.uInvProjMatrix, false, invProjMatrix);

  // Compute and set the texture scale and crop offsets.
  const textureCrop = layer.effects().textureCrop || {};
  const textureX = textureCrop.x != null ? textureCrop.x : 0;
  const textureY = textureCrop.y != null ? textureCrop.y : 0;
  const textureWidth = textureCrop.width != null ? textureCrop.width : 1;
  const textureHeight = textureCrop.height != null ? textureCrop.height : 1;

  gl.uniform1f(shaderProgram.uTextureX, textureX);
  gl.uniform1f(shaderProgram.uTextureY, textureY);
  gl.uniform1f(shaderProgram.uTextureWidth, textureWidth);
  gl.uniform1f(shaderProgram.uTextureHeight, textureHeight);

  setupPixelEffectUniforms(gl, layer.effects(), {
    opacity: shaderProgram.uOpacity,
    colorOffset: shaderProgram.uColorOffset,
    colorMatrix: shaderProgram.uColorMatrix,
  });
};

WebGlEquirectRenderer.prototype.endLayer = function (_layer, _rect) {
  const gl = this.gl;
  const shaderProgram = this.shaderProgram;
  disableAttributes(gl, shaderProgram);
};

WebGlEquirectRenderer.prototype.renderTile = function (tile, texture, layer, layerZ) {
  const gl = this.gl;
  const shaderProgram = this.shaderProgram;
  const constantBuffers = this.constantBuffers;

  setDepth(gl, shaderProgram, layerZ, tile.z);

  setTexture(gl, shaderProgram, texture);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, constantBuffers.vertexIndices);
  gl.drawElements(gl.TRIANGLES, vertexIndices.length, gl.UNSIGNED_SHORT, 0);
};

export default WebGlEquirectRenderer;
