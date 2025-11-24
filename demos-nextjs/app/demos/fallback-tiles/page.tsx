'use client';

import { useEffect, useRef } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function FallbackTilesPage() {
  const stageRef = useRef<any>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    viewerRef.current = viewer;

    // Get the stage.
    const stage = viewer.stage();
    stageRef.current = stage;

    // Set up view.
    const initialViewParams = { yaw: Math.PI/16, pitch: 0, fov: Math.PI/2 };
    const view = new Marzipano.RectilinearView(initialViewParams);

    // Set up the bottom layer (fallback).
    const levelsBelow = [512].map(function(size) {
      return {size: size, tileSize: 512};
    });
    const geometryBelow = new Marzipano.CubeGeometry(levelsBelow);
    const sourceBelow = new Marzipano.ImageUrlSource(function(tile: any) {
      return { url: "/media/pixels/red.png" };
    });
    const textureStoreBelow = new Marzipano.TextureStore(sourceBelow, stage);
    const layerBelow = new Marzipano.Layer(
      sourceBelow, geometryBelow, view, textureStoreBelow, 
      { effects: { opacity: 1 } }
    );

    // Set up the top layer.
    const levelsAbove = [512, 1024, 2048, 4096].map(function(size) {
      return {size: size, tileSize: 512};
    });
    const geometryAbove = new Marzipano.CubeGeometry(levelsAbove);
    const sourceAbove = new Marzipano.ImageUrlSource(function(tile: any) {
      return { 
        url: "/media/generated-tiles/" +
          tile.z + '_' + tile.face + '_' + tile.x + '_' + tile.y + '.png' 
      };
    });
    const textureStoreAbove = new Marzipano.TextureStore(sourceAbove, stage);
    const layerAbove = new Marzipano.Layer(
      sourceAbove, geometryAbove, view, textureStoreAbove, 
      { effects: { opacity: 0.6 } }
    );

    // Add layers to stage.
    (stage as any).addLayer(layerBelow);
    (stage as any).addLayer(layerAbove);

    // Pin level 0 so it serves as the last-resort fallback.
    layerAbove.pinLevel(0);
  };

  return (
    <DemoLayout 
      title="Fallback Tiles" 
      description="Demonstrates fallback tile handling when tiles fail to load"
    >
      <MarzipanoViewer 
        className="w-full h-full"
        onViewerReady={handleViewerReady}
      />
    </DemoLayout>
  );
}

