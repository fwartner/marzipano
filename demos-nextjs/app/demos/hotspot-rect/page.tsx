'use client';

import { useEffect, useRef } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function HotspotRectPage() {
  const stageRef = useRef<any>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    viewerRef.current = viewer;

    // Get the stage.
    const stage = viewer.stage();
    stageRef.current = stage;

    // Create source.
    const source = Marzipano.ImageUrlSource.fromString(
      "/media/cubemap/{f}.jpg",
      {}
    );

    // Create geometry.
    const geometry = new Marzipano.CubeGeometry([{ tileSize: 1024, size: 1024 }]);

    // Create view limiter.
    const limiter = Marzipano.RectilinearView.limit.traditional(1024, 100*Math.PI/180);

    const rects = [
      null,
      { relativeWidth: 0.6, relativeHeight: 0.3, relativeX: 0.6 },
      { relativeWidth: 0.6, relativeHeight: 0.7, relativeX: 0.4, relativeY: 0.3 }
    ];

    // Create layers with different `rect` parameters and with hotspots.
    rects.forEach(function(rect) {
      // Create layer.
      const view = new Marzipano.RectilinearView(null);
      const textureStore = new Marzipano.TextureStore(source, stage);
      const layer = new Marzipano.Layer(source, geometry, view, textureStore, { effects: { rect: rect } });

      // Add hotspot.
      const hotspotContainer = new Marzipano.HotspotContainer(viewer.domElement(), stage, view, viewer.renderLoop(), { rect: rect });
      const hotspotElement = document.createElement('div');
      hotspotElement.className = 'hotspot';
      hotspotContainer.createHotspot(hotspotElement, { yaw: 0.1, pitch: -0.3 });

      // Add layer into stage.
      (stage as any).addLayer(layer);
    });
  };

  return (
    <DemoLayout 
      title="Hotspots with Rect Effect" 
      description="Hotspots can be used together with the Rect Effect on browsers that support CSS pointer-events. On browsers which do not support them the hotspots will be hidden if rect is defined."
    >
      <MarzipanoViewer 
        className="w-full h-full"
        onViewerReady={handleViewerReady}
      />
    </DemoLayout>
  );
}

