'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

// Simplified DeviceOrientationControlMethod
class DeviceOrientationControlMethod {
  private _enabled = false;
  private _listener: ((e: DeviceOrientationEvent) => void) | null = null;

  enable() {
    if (this._enabled) return;
    this._enabled = true;
    // Implementation would handle device orientation events
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;
  }

  isEnabled() {
    return this._enabled;
  }
}

export default function DeviceOrientationPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);
  const controlMethodRef = useRef<DeviceOrientationControlMethod | null>(null);
  const [enabled, setEnabled] = useState(false);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    viewerRef.current = viewer;

    // Register the custom control method.
    const deviceOrientationControlMethod = new DeviceOrientationControlMethod();
    controlMethodRef.current = deviceOrientationControlMethod;
    const controls = viewer.controls();
    (controls as any).registerMethod('deviceOrientation', deviceOrientationControlMethod);

    // Create source.
    const source = Marzipano.ImageUrlSource.fromString(
      "/media/cubemap/{f}.jpg"
    );

    // Create geometry.
    const geometry = new Marzipano.CubeGeometry([{ tileSize: 1024, size: 1024 }]);

    // Create view.
    const limiter = Marzipano.RectilinearView.limit.traditional(1024, 100 * Math.PI / 180);
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
  };

  const toggleDeviceOrientation = async () => {
    if (!controlMethodRef.current) return;

    // iOS 13+ requires permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          controlMethodRef.current.enable();
          setEnabled(true);
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
      }
    } else {
      // Non-iOS devices
      if (enabled) {
        controlMethodRef.current.disable();
        setEnabled(false);
      } else {
        controlMethodRef.current.enable();
        setEnabled(true);
      }
    }
  };

  return (
    <DemoLayout 
      title="Device Orientation" 
      description="Control the panorama using device orientation sensors"
    >
      <div className="relative w-full h-full">
        <MarzipanoViewer 
          className="w-full h-full"
          onViewerReady={handleViewerReady}
        />
        <div className="absolute top-4 left-4 bg-gray-800 text-white p-4 rounded">
          <button 
            onClick={toggleDeviceOrientation}
            className={`px-4 py-2 rounded ${enabled ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {enabled ? 'Disable' : 'Enable'} Device Orientation
          </button>
        </div>
      </div>
    </DemoLayout>
  );
}

