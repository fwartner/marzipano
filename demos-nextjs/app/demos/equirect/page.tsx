'use client';

import { useEffect, useRef } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function EquirectPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create source.
    const source = Marzipano.ImageUrlSource.fromString(
      "/media/equirect/angra.jpg",
      {}
    );

    // Create geometry.
    const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

    // Create view.
    const limiter = Marzipano.RectilinearView.limit.traditional(1024, 100*Math.PI/180);
    const view = new Marzipano.RectilinearView({ yaw: Math.PI }, limiter);

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
      title="Equirectangular" 
      description="Display an equirectangular image."
    >
      <MarzipanoViewer 
        className="w-full h-full"
        onViewerReady={handleViewerReady}
      />
    </DemoLayout>
  );
}

