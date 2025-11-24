'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function WebVRPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);
  const [vrSupported, setVrSupported] = useState(false);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create geometry.
    const geometry = new Marzipano.CubeGeometry([
      { tileSize: 256, size: 256, fallbackOnly: true },
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 },
      { tileSize: 512, size: 4096 }
    ]);

    // Create source.
    const source = Marzipano.ImageUrlSource.fromString(
      "/media/outdoors/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: "/media/outdoors/preview.jpg" }
    );

    // Create view.
    const limiter = Marzipano.RectilinearView.limit.traditional(4096, 110*Math.PI/180);
    const view = new Marzipano.RectilinearView(null, limiter);

    // Create scene.
    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    sceneRef.current = scene;
    scene.switchTo();

    // Check VR support
    if (typeof navigator !== 'undefined' && (navigator as any).getVRDisplays) {
      (navigator as any).getVRDisplays().then((displays: any[]) => {
        setVrSupported(displays.length > 0);
      });
    }
  };

  return (
    <DemoLayout 
      title="WebVR" 
      description="WebVR integration for virtual reality experiences"
    >
      <div className="relative w-full h-full">
        <MarzipanoViewer 
          className="w-full h-full"
          onViewerReady={handleViewerReady}
        />
        {!vrSupported && (
          <div className="absolute top-4 left-4 bg-yellow-600 text-black p-4 rounded">
            WebVR may not be supported in this browser. Try a VR-compatible browser.
          </div>
        )}
      </div>
    </DemoLayout>
  );
}

