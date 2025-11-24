'use client';

import { useEffect, useRef } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function TouchGesturesPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create source.
    const source = Marzipano.ImageUrlSource.fromString(
      "/media/equirect/{z}.jpg"
    );

    // Create geometry.
    const geometry = new Marzipano.EquirectGeometry([
      { width: 4096 },
      { width: 2048 }
    ]);

    // Create view.
    const limiter = Marzipano.RectilinearView.limit.traditional(4096, 100 * Math.PI / 180);
    const view = new Marzipano.RectilinearView({ yaw: 0 }, limiter);

    // Create scene.
    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    sceneRef.current = scene;
    scene.switchTo();
  };

  return (
    <DemoLayout 
      title="Touch Gestures" 
      description="Touch gesture controls for mobile devices"
    >
      <MarzipanoViewer 
        className="w-full h-full"
        onViewerReady={handleViewerReady}
      />
    </DemoLayout>
  );
}

