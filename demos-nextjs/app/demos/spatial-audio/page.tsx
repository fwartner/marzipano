'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function SpatialAudioPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create a simple equirect scene
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
  };

  const initAudio = async () => {
    if (!sceneRef.current || audioInitialized) return;

    try {
      // Get audio context using AudioManager
      const audioContext = Marzipano.audioManager.getContext();
      
      // Resume context (required for autoplay policy)
      await Marzipano.audioManager.resume();

      // Create audio anchors at different positions
      // This is a simplified version - full implementation would create oscillators or load audio files
      console.log('Audio initialized with context:', audioContext);
      setAudioInitialized(true);
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  };

  return (
    <DemoLayout 
      title="Spatial Audio" 
      description="Spatial audio support for immersive experiences"
    >
      <div className="relative w-full h-full">
        <MarzipanoViewer 
          className="w-full h-full"
          onViewerReady={handleViewerReady}
        />
        {!audioInitialized && (
          <div className="absolute top-4 left-4 bg-gray-800 text-white p-4 rounded">
            <button 
              onClick={initAudio}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Initialize Audio
            </button>
          </div>
        )}
        {audioInitialized && (
          <div className="absolute top-4 left-4 bg-green-600 text-white p-4 rounded">
            Audio Initialized
          </div>
        )}
      </div>
    </DemoLayout>
  );
}

