'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function WebXRImmersivePage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);
  const [xrSupported, setXrSupported] = useState(false);
  const [inVR, setInVR] = useState(false);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    viewerRef.current = viewer;

    // Create scene
    const source = Marzipano.ImageUrlSource.fromString(
      '/media/equirect/{z}.jpg'
    );
    const geometry = new Marzipano.EquirectGeometry([
      { width: 4096 },
      { width: 2048 }
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

    // Check XR support
    if (viewer.isXREnabled && viewer.isXREnabled()) {
      setXrSupported(true);
    } else if (typeof navigator !== 'undefined' && (navigator as any).xr) {
      (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        setXrSupported(supported);
      });
    }
  };

  const enterVR = async () => {
    if (!viewerRef.current || !xrSupported) return;

    try {
      // Enter immersive VR mode
      // This is a simplified version - full implementation would handle XR session
      console.log('Entering VR mode...');
      setInVR(true);
    } catch (error) {
      console.error('Error entering VR:', error);
    }
  };

  return (
    <DemoLayout 
      title="WebXR Immersive" 
      description="WebXR immersive mode for VR/AR experiences"
    >
      <div className="relative w-full h-full">
        <MarzipanoViewer 
          className="w-full h-full"
          onViewerReady={handleViewerReady}
        />
        <div className="absolute top-4 left-4 bg-gray-800 text-white p-4 rounded">
          {xrSupported ? (
            <button 
              onClick={enterVR}
              disabled={inVR}
              className={`px-4 py-2 rounded ${inVR ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {inVR ? 'In VR Mode' : 'Enter VR'}
            </button>
          ) : (
            <div className="text-yellow-400">
              WebXR not supported in this browser
            </div>
          )}
        </div>
      </div>
    </DemoLayout>
  );
}

