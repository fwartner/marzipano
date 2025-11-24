'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function PerformanceTelemetryPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);
  const [fps, setFps] = useState(0);
  const [backend, setBackend] = useState('');

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    viewerRef.current = viewer;

    // Set initial LOD policy
    (viewer as any).setLODPolicy({
      maxGpuMB: 256,
      prefetchAhead: 2,
      evictionStrategy: 'hybrid'
    });

    // Create scene
    const source = (Marzipano.ImageUrlSource.fromString as any)(
      '/media/equirect/{z}.jpg'
    );
    const geometry = new Marzipano.EquirectGeometry([
      { width: 4096 },
      { width: 2048 },
      { width: 1024 }
    ]);
    const limiter = Marzipano.RectilinearView.limit.traditional(4096, 100 * Math.PI / 180);
    const view = new Marzipano.RectilinearView({ yaw: 0 }, limiter);

    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view
    });

    sceneRef.current = scene;
    scene.switchTo();

    // Display backend info
    if ((viewer as any).getBackend) {
      setBackend((viewer as any).getBackend().toUpperCase());
    }

    // Listen for performance events
    if (viewer.on) {
      viewer.on('perf', (sample: any) => {
        if (sample.fps !== undefined) {
          setFps(Math.round(sample.fps));
        }
      });
    }
  };

  return (
    <DemoLayout 
      title="Performance Telemetry" 
      description="Performance monitoring and telemetry"
    >
      <div className="flex h-full">
        <div className="flex-1">
          <MarzipanoViewer 
            className="w-full h-full"
            onViewerReady={handleViewerReady}
          />
        </div>
        <div className="w-80 bg-gray-800 text-white p-4">
          <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400">Backend</div>
              <div className="text-lg font-semibold">{backend || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">FPS</div>
              <div className="text-lg font-semibold">{fps}</div>
            </div>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}

