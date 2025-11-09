/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @module HDR
 * @desc HDR (High Dynamic Range) utilities for decoding and tone mapping.
 */

/**
 * GLSL function for RGBM decode
 * @return {string} GLSL code
 */
export function getRGBMDecodeGLSL() {
  return `
    vec3 decodeRGBM(vec4 rgbm, float maxRange) {
      return rgbm.rgb * rgbm.a * maxRange;
    }
  `;
}

/**
 * GLSL function for RGBE decode
 * @return {string} GLSL code
 */
export function getRGBEDecodeGLSL() {
  return `
    vec3 decodeRGBE(vec4 rgbe) {
      float exponent = rgbe.a * 255.0 - 128.0;
      return rgbe.rgb * pow(2.0, exponent);
    }
  `;
}

/**
 * GLSL function for Reinhard tone mapping
 * @return {string} GLSL code
 */
export function getReinhardToneMappingGLSL() {
  return `
    vec3 reinhardToneMapping(vec3 color, float exposure) {
      color *= exposure;
      return color / (1.0 + color);
    }
  `;
}

/**
 * GLSL function for ACES tone mapping (approximation)
 * @return {string} GLSL code
 */
export function getACESToneMappingGLSL() {
  return `
    vec3 acesToneMapping(vec3 color, float exposure) {
      color *= exposure;
      
      // ACES approximation
      const float a = 2.51;
      const float b = 0.03;
      const float c = 2.43;
      const float d = 0.59;
      const float e = 0.14;
      
      return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
    }
  `;
}

/**
 * GLSL function for gamma correction
 * @return {string} GLSL code
 */
export function getGammaCorrectionGLSL() {
  return `
    vec3 gammaCorrection(vec3 color, float gamma) {
      return pow(color, vec3(1.0 / gamma));
    }
  `;
}

/**
 * GLSL function for luminance calculation
 * @return {string} GLSL code
 */
export function getLuminanceGLSL() {
  return `
    float luminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }
  `;
}

/**
 * Get complete tone mapping shader code
 * @param {string} mode - 'none', 'reinhard', or 'aces'
 * @param {boolean} includeRGBM - Whether to include RGBM decode
 * @param {boolean} includeRGBE - Whether to include RGBE decode
 * @return {string} GLSL code
 */
export function getToneMappingShaderCode(mode, includeRGBM = false, includeRGBE = false) {
  let code = '';

  // Add decode functions if needed
  if (includeRGBM) {
    code += `${getRGBMDecodeGLSL()}\n`;
  }
  if (includeRGBE) {
    code += `${getRGBEDecodeGLSL()}\n`;
  }

  // Always include luminance and gamma correction
  code += `${getLuminanceGLSL()}\n`;
  code += `${getGammaCorrectionGLSL()}\n`;

  // Add tone mapping function
  if (mode === 'reinhard') {
    code += `${getReinhardToneMappingGLSL()}\n`;
  } else if (mode === 'aces') {
    code += `${getACESToneMappingGLSL()}\n`;
  }

  // Add main tone mapping function
  code += `
    vec3 applyToneMapping(vec3 color, float exposure, float gamma, int mode) {
      if (mode == 1) {
        // Reinhard
        color = reinhardToneMapping(color, exposure);
      } else if (mode == 2) {
        // ACES
        color = acesToneMapping(color, exposure);
      } else {
        // None - just apply exposure
        color *= exposure;
      }
      
      // Apply gamma correction
      color = gammaCorrection(color, gamma);
      
      return color;
    }
  `;

  return code;
}

/**
 * Tone mapping settings
 */
export class ToneMappingSettings {
  constructor() {
    this.mode = 'none'; // 'none', 'reinhard', 'aces'
    this.exposure = 1.0;
    this.gamma = 2.2;
  }

  /**
   * Get mode as integer for shader uniform
   * @return {number} 0=none, 1=reinhard, 2=aces
   */
  getModeInt() {
    switch (this.mode) {
      case 'reinhard':
        return 1;
      case 'aces':
        return 2;
      default:
        return 0;
    }
  }

  /**
   * Clone settings
   * @return {ToneMappingSettings}
   */
  clone() {
    const settings = new ToneMappingSettings();
    settings.mode = this.mode;
    settings.exposure = this.exposure;
    settings.gamma = this.gamma;
    return settings;
  }

  /**
   * Apply settings from object
   * @param {Object} opts
   */
  apply(opts) {
    if (opts.mode !== undefined) this.mode = opts.mode;
    if (opts.exposure !== undefined) this.exposure = opts.exposure;
    if (opts.gamma !== undefined) this.gamma = opts.gamma;
  }
}

export default {
  getRGBMDecodeGLSL,
  getRGBEDecodeGLSL,
  getReinhardToneMappingGLSL,
  getACESToneMappingGLSL,
  getGammaCorrectionGLSL,
  getLuminanceGLSL,
  getToneMappingShaderCode,
  ToneMappingSettings,
};
