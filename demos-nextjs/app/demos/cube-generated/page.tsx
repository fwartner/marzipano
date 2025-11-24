'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

// Simplified SolidColorSource
class SolidColorSource {
  private _width: number;
  private _height: number;

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  private _tileText(tile: any) {
    const components: string[] = [];
    if (tile.face) {
      components.push("face:" + tile.face);
    }
    components.push("x:" + tile.x);
    components.push("y:" + tile.y);
    components.push("zoom:" + tile.z);
    return components.join(" ");
  }

  private _tileColor(tile: any) {
    switch (tile.face) {
      case 'u': return "#999";
      case 'b': return "#aaa";
      case 'd': return "#bbb";
      case 'f': return "#ccc";
      case 'r': return "#ddd";
      case 'l': return "#eee";
      default: return "#ddd";
    }
  }

  loadAsset(stage: any, tile: any, done: any) {
    const width = this._width;
    const height = this._height;
    const text = this._tileText(tile);
    const color = this._tileColor(tile);

    // Create the canvas element.
    const element = document.createElement("canvas");
    element.width = width;
    element.height = height;
    const ctx = element.getContext("2d");
    if (!ctx) return;

    // Draw tile background.
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    // Draw tile border.
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#000";
    ctx.strokeRect(0, 0, width, height);

    // Draw tile text.
    ctx.fillStyle = "#000";
    ctx.font = (width/20) + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, width/2, height/2);

    // Pass result into callback.
    setTimeout(function() {
      const asset = new Marzipano.StaticAsset(element);
      done(null, tile, asset);
    }, 0);
  }
}

export default function CubeGeneratedPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);
  const viewRef = useRef<Marzipano.RectilinearView | null>(null);
  const geometryRef = useRef<Marzipano.CubeGeometry | null>(null);
  const [stats, setStats] = useState({ fov: '0°', faceTiles: '0', facePixels: '0', totalTiles: '0', totalPixels: '0' });

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create procedurally-generated single-color tile source.
    const source = new SolidColorSource(512, 512) as any;

    // Create geometry with a very large number of levels.
    const levels = [];
    for(let i = 0; i < 32; i++) {
      levels.push({ tileSize: 512, size: 512 * Math.pow(2, i) });
    }
    const geometry = new Marzipano.CubeGeometry(levels);
    geometryRef.current = geometry;

    // Create view.
    const view = new Marzipano.RectilinearView();
    viewRef.current = view;

    // Create scene.
    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    sceneRef.current = scene;
    scene.switchTo();

    // Show stats about the current view and cubemap size.
    (view as any).addEventListener('change', function() {
      const level = view.selectLevel(geometry.levelList);

      const faceTiles = level.numHorizontalTiles() * level.numVerticalTiles();
      const totalTiles = faceTiles * 6;
      const faceMegaPixels = (level.width()/1000) * (level.height()/1000);
      const totalMegaPixels = faceMegaPixels * 6;

      const fovDeg = view.fov() * 180/Math.PI;
      const fovFormatted = fovDeg.toFixed(10) + '°';

      const faceTilesFormatted = formatTileNum(faceTiles);
      const totalTilesFormatted = formatTileNum(totalTiles);
      const facePixelsFormatted = formatMegaPixels(faceMegaPixels) + 'pixel';
      const totalPixelsFormatted = formatMegaPixels(totalMegaPixels) + 'pixel';

      setStats({
        fov: fovFormatted,
        faceTiles: faceTilesFormatted,
        totalTiles: totalTilesFormatted,
        facePixels: facePixelsFormatted,
        totalPixels: totalPixelsFormatted
      });
    });
  };

  function formatMegaPixels(num: number) {
    const suffixes = ['Mega', 'Giga', 'Tera', 'Peta', 'Exa', 'Zetta'];
    let i = 0;
    for (i = 0; i < suffixes.length; i++) {
      const divider = Math.pow(1000, i);
      if (num < divider) {
        break;
      }
    }
    i -= 1;
    const divided = num / Math.pow(1000, i);
    const formatted = divided.toFixed(2) + ' ' + suffixes[i];
    return formatted;
  }

  function formatTileNum(num: number) {
    const suffixes = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z'];
    if (num < 999999) {
      return num.toString();
    }
    let i = 0;
    for (i = 0; i < suffixes.length; i++) {
      const divider = Math.pow(1000, i);
      if (num < divider) {
        break;
      }
    }
    i -= 1;
    const divided = num / Math.pow(1000, i);
    const formatted = divided.toFixed(2) + suffixes[i];
    return formatted;
  }

  return (
    <DemoLayout 
      title="Cube Generated" 
      description="Procedurally generated multi-resolution cube"
    >
      <div className="flex h-full">
        <div className="flex-1">
          <MarzipanoViewer 
            className="w-full h-full"
            onViewerReady={handleViewerReady}
          />
        </div>
        <div className="w-80 bg-gray-800 text-white p-4">
          <h2 className="text-xl font-bold mb-4">Stats</h2>
          <div className="space-y-2 text-sm">
            <div>Fov: <span className="font-semibold">{stats.fov}</span></div>
            <div>Face tiles: <span className="font-semibold">{stats.faceTiles}</span></div>
            <div>Face size: <span className="font-semibold">{stats.facePixels}</span></div>
            <div>Total tiles: <span className="font-semibold">{stats.totalTiles}</span></div>
            <div>Total size: <span className="font-semibold">{stats.totalPixels}</span></div>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}

