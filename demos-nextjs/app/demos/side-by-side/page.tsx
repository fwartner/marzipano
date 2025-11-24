'use client';

import { useEffect, useRef } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function SideBySidePage() {
  const stageRef = useRef<any>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    viewerRef.current = viewer;

    // Get the stage.
    const stage = viewer.stage();
    stageRef.current = stage;

    // Create geometry.
    const geometry = new Marzipano.CubeGeometry([
      { tileSize: 256, size: 256, fallbackOnly: true },
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 },
      { tileSize: 512, size: 4096 }
    ]);

    // Create views.
    const viewLimiter = Marzipano.RectilinearView.limit.traditional(3100, 100*Math.PI/180);
    const viewLeft = new Marzipano.RectilinearView(null, viewLimiter);
    const viewRight = new Marzipano.RectilinearView(null, viewLimiter);

    // Create layers.
    const urlPrefix = "/media/music-room";
    
    // Left layer
    const sourceLeft = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/left/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/left/preview.jpg" }
    );
    const textureStoreLeft = new Marzipano.TextureStore(sourceLeft, stage);
    const leftLayer = new Marzipano.Layer(
      sourceLeft, geometry, viewLeft, textureStoreLeft,
      { effects: { rect: { relativeWidth: 0.5, relativeX: 0 } } }
    );

    // Right layer
    const sourceRight = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/right/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/right/preview.jpg" }
    );
    const textureStoreRight = new Marzipano.TextureStore(sourceRight, stage);
    const rightLayer = new Marzipano.Layer(
      sourceRight, geometry, viewRight, textureStoreRight,
      { effects: { rect: { relativeWidth: 0.5, relativeX: 0.5 } } }
    );

    // Add layers to stage.
    (stage as any).addLayer(leftLayer);
    (stage as any).addLayer(rightLayer);
  };

  return (
    <DemoLayout 
      title="Side by Side" 
      description="Side-by-side comparison of two panoramas"
    >
      <MarzipanoViewer 
        className="w-full h-full"
        onViewerReady={handleViewerReady}
      />
    </DemoLayout>
  );
}

