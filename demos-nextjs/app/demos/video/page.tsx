'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

// Simplified VideoAsset for demo
class VideoAsset {
  private _videoElement: HTMLVideoElement | null = null;
  private _emptyCanvas: HTMLCanvasElement;

  constructor() {
    this._emptyCanvas = document.createElement('canvas');
    this._emptyCanvas.width = 1;
    this._emptyCanvas.height = 1;
  }

  setVideo(videoElement: HTMLVideoElement) {
    this._videoElement = videoElement;
  }

  width() {
    return this._videoElement ? this._videoElement.videoWidth : this._emptyCanvas.width;
  }

  height() {
    return this._videoElement ? this._videoElement.videoHeight : this._emptyCanvas.height;
  }

  element() {
    return this._videoElement || this._emptyCanvas;
  }

  isDynamic() {
    return true;
  }

  timestamp() {
    return this._videoElement ? this._videoElement.currentTime : 0;
  }
}

export default function VideoPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);
  const assetRef = useRef<VideoAsset | null>(null);
  const [started, setStarted] = useState(false);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create asset and source.
    const asset = new VideoAsset();
    assetRef.current = asset;
    const source = new Marzipano.SingleAssetSource(asset);

    // Create geometry.
    const geometry = new Marzipano.EquirectGeometry([{ width: 1 }]);

    // Create view.
    const limiter = Marzipano.RectilinearView.limit.vfov(90*Math.PI/180, 90*Math.PI/180);
    const view = new Marzipano.RectilinearView({ fov: Math.PI/2 }, limiter);

    // Create scene.
    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view
    });

    sceneRef.current = scene;
    scene.switchTo();
  };

  const tryStart = () => {
    if (started || !assetRef.current) return;
    setStarted(true);

    const video = document.createElement('video');
    video.src = '/media/video/mercedes-f1-1280x640.mp4';
    video.crossOrigin = 'anonymous';
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');

    video.play();

    const checkReady = () => {
      if (video.readyState >= video.HAVE_ENOUGH_DATA) {
        assetRef.current?.setVideo(video);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  };

  return (
    <DemoLayout 
      title="Video" 
      description="Video playback in panoramas"
    >
      <div className="relative w-full h-full" onClick={tryStart} onTouchStart={tryStart}>
        <MarzipanoViewer 
          className="w-full h-full"
          onViewerReady={handleViewerReady}
        />
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xl">
            Click to start video playback
          </div>
        )}
      </div>
    </DemoLayout>
  );
}

