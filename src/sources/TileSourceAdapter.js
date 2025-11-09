/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @interface TileSourceAdapter
 * @classdesc
 *
 * An interface for custom tile source adapters that can generate
 * tile URLs based on tile coordinates. This enables support for
 * deep-zoom/IIIF-style tile sources and other custom tiling schemes.
 *
 * Implementations should provide a urlFor() method that returns
 * the URL for a given tile.
 */

/**
 * Example IIIF Tile Source Adapter
 *
 * @class IIIFTileSourceAdapter
 * @implements TileSourceAdapter
 *
 * @example
 * const adapter = new IIIFTileSourceAdapter({
 *   baseUrl: 'https://example.com/iiif/image',
 *   tileSize: 512,
 *   quality: 'default',
 *   format: 'jpg'
 * });
 *
 * const source = ImageUrlSource.fromTiles(adapter);
 */
export class IIIFTileSourceAdapter {
  /**
   * @param {Object} opts - Adapter options
   * @param {string} opts.baseUrl - Base URL for the IIIF image
   * @param {number} [opts.tileSize=512] - Tile size in pixels
   * @param {string} [opts.quality='default'] - IIIF quality parameter
   * @param {string} [opts.format='jpg'] - Image format
   */
  constructor(opts) {
    this._baseUrl = opts.baseUrl;
    this._tileSize = opts.tileSize || 512;
    this._quality = opts.quality || 'default';
    this._format = opts.format || 'jpg';
  }

  /**
   * Generate URL for a tile
   * @param {number} level - Zoom level
   * @param {number} face - Cube face (for cube geometries, unused for flat/equirect)
   * @param {number} x - Tile X coordinate
   * @param {number} y - Tile Y coordinate
   * @return {string} Tile URL
   */
  urlFor(level, face, x, y) {
    // IIIF Image API 2.1 format:
    // {scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}

    const tileSize = this._tileSize;
    const xPos = x * tileSize;
    const yPos = y * tileSize;

    // Region: x,y,w,h
    const region = `${xPos},${yPos},${tileSize},${tileSize}`;

    // Size: full tile size
    const size = `${tileSize},`;

    // Rotation: 0 degrees
    const rotation = '0';

    return `${this._baseUrl}/${region}/${size}/${rotation}/${this._quality}.${this._format}`;
  }
}

/**
 * Example Deep Zoom Tile Source Adapter
 *
 * @class DeepZoomTileSourceAdapter
 * @implements TileSourceAdapter
 *
 * @example
 * const adapter = new DeepZoomTileSourceAdapter({
 *   baseUrl: 'https://example.com/deepzoom/image',
 *   format: 'jpg'
 * });
 *
 * const source = ImageUrlSource.fromTiles(adapter);
 */
export class DeepZoomTileSourceAdapter {
  /**
   * @param {Object} opts - Adapter options
   * @param {string} opts.baseUrl - Base URL for the deep zoom image
   * @param {string} [opts.format='jpg'] - Image format
   */
  constructor(opts) {
    this._baseUrl = opts.baseUrl;
    this._format = opts.format || 'jpg';
  }

  /**
   * Generate URL for a tile
   * @param {number} level - Zoom level
   * @param {number} face - Cube face (for cube geometries, unused for flat/equirect)
   * @param {number} x - Tile X coordinate
   * @param {number} y - Tile Y coordinate
   * @return {string} Tile URL
   */
  urlFor(level, face, x, y) {
    // Deep Zoom format: {base_url}/{level}/{x}_{y}.{format}
    return `${this._baseUrl}/${level}/${x}_${y}.${this._format}`;
  }
}

/**
 * Example Google Maps-style Tile Source Adapter
 *
 * @class GoogleMapsTileSourceAdapter
 * @implements TileSourceAdapter
 *
 * @example
 * const adapter = new GoogleMapsTileSourceAdapter({
 *   baseUrl: 'https://tiles.example.com'
 * });
 *
 * const source = ImageUrlSource.fromTiles(adapter);
 */
export class GoogleMapsTileSourceAdapter {
  /**
   * @param {Object} opts - Adapter options
   * @param {string} opts.baseUrl - Base URL for tiles
   * @param {string} [opts.format='png'] - Image format
   */
  constructor(opts) {
    this._baseUrl = opts.baseUrl;
    this._format = opts.format || 'png';
  }

  /**
   * Generate URL for a tile
   * @param {number} level - Zoom level
   * @param {number} face - Cube face (for cube geometries, unused for flat/equirect)
   * @param {number} x - Tile X coordinate
   * @param {number} y - Tile Y coordinate
   * @return {string} Tile URL
   */
  urlFor(level, face, x, y) {
    // Google Maps format: {base_url}/{z}/{x}/{y}.{format}
    return `${this._baseUrl}/${level}/${x}/${y}.${this._format}`;
  }
}

export default {
  IIIFTileSourceAdapter,
  DeepZoomTileSourceAdapter,
  GoogleMapsTileSourceAdapter,
};
