'use client';

import { useEffect, useRef } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function CubeSingleResPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create source.
    const source = Marzipano.ImageUrlSource.fromString(
      "/media/cubemap/{f}.jpg",
      {}
    );

    // Create geometry.
    const geometry = new Marzipano.CubeGeometry([{ tileSize: 1024, size: 1024 }]);

    // Create view.
    const limiter = Marzipano.RectilinearView.limit.traditional(4096, 100*Math.PI/180);
    const view = new Marzipano.RectilinearView(null, limiter);

    // Create scene.
    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    sceneRef.current = scene;

    // Display scene.
    scene.switchTo();
  };

  return (
    <DemoLayout 
      title="Cube Single Resolution" 
      description="Display a cubemap with a single resolution level."
    >
      <MarzipanoViewer 
        className="w-full h-full"
        onViewerReady={handleViewerReady}
      />
    </DemoLayout>
  );
}

