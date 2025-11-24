'use client';

import { useEffect, useRef } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function HotspotStylesPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create source.
    const source = Marzipano.ImageUrlSource.fromString(
      "/media/furnace/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: "/media/furnace/preview.jpg" }
    );

    // Create geometry.
    const geometry = new Marzipano.CubeGeometry([
      { tileSize: 256, size: 256, fallbackOnly: true },
      { size: 512, tileSize: 512 },
      { size: 1024, tileSize: 512 },
      { size: 2048, tileSize: 512 }
    ]);

    // Create view.
    const limiter = Marzipano.RectilinearView.limit.traditional(2048, 120*Math.PI/180);
    const view = new Marzipano.RectilinearView(null, limiter);

    // Create scene.
    const scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    sceneRef.current = scene;

    // Display scene.
    scene.switchTo({ transitionDuration: 0 });

    // Create various styled hotspots
    const container = scene.hotspotContainer();

    // Simple hotspot with hint
    const hintspot = document.createElement('div');
    hintspot.id = 'hintspot';
    hintspot.innerHTML = '<a href="https://github.com/chinchang/hint.css" target="_blank" style="display: block;"><img src="/demos/hotspot-styles/img/hotspot.png" alt="Hotspot" style="width: 50px; height: 50px;"></a>';
    hintspot.setAttribute('title', 'hint.css!');
    container.createHotspot(hintspot, { yaw: 2.15, pitch: 0 });

    // Tooltip hotspot
    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.innerHTML = `
      <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 24px;">ℹ️</span>
      </div>
    `;
    tooltip.setAttribute('title', 'Go to the Furnace Room');
    container.createHotspot(tooltip, { yaw: 2.95, pitch: -0.05 });

    // Info hotspot
    const info = document.createElement('div');
    info.id = 'info';
    info.innerHTML = `
      <div style="width: 50px; height: 50px; background: rgba(0,150,255,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <span style="font-size: 24px;">ℹ️</span>
      </div>
    `;
    info.setAttribute('title', 'Click to sign up!');
    container.createHotspot(info, { yaw: 1.5, pitch: 0.2 });

    // Rotate hotspot
    const rotate = document.createElement('div');
    rotate.id = 'rotate-hotspot';
    rotate.innerHTML = `
      <div style="width: 60px; height: 60px; background: rgba(255,100,0,0.8); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">🔄</span>
      </div>
    `;
    container.createHotspot(rotate, { yaw: 0.5, pitch: -0.3 });

    // Reveal hotspot
    const reveal = document.createElement('div');
    reveal.id = 'reveal';
    reveal.innerHTML = `
      <div style="width: 50px; height: 50px; background: rgba(100,200,100,0.8); border-radius: 5px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 24px;">👁️</span>
      </div>
    `;
    container.createHotspot(reveal, { yaw: 3.5, pitch: 0.1 });

    // Text info hotspot
    const textInfo = document.createElement('div');
    textInfo.id = 'textInfo';
    textInfo.innerHTML = `
      <div style="width: 50px; height: 50px; background: rgba(200,100,200,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 20px;">📝</span>
      </div>
    `;
    textInfo.setAttribute('title', 'The Ash Room is the area where ash from the burned and raw coal was collected...');
    container.createHotspot(textInfo, { yaw: 4.0, pitch: -0.2 });

    // Expand hotspot
    const expand = document.createElement('div');
    expand.id = 'expand';
    expand.innerHTML = `
      <div style="width: 50px; height: 50px; background: rgba(255,200,0,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 24px;">👤</span>
      </div>
    `;
    expand.setAttribute('title', 'Human (Homo sapiens primarily ssp. Homo sapiens sapiens)');
    container.createHotspot(expand, { yaw: 5.0, pitch: 0.15 });
  };

  return (
    <DemoLayout 
      title="Hotspot Styles" 
      description="Showcase some hotspot styles and effects that may be created with CSS."
    >
      <MarzipanoViewer 
        className="w-full h-full"
        onViewerReady={handleViewerReady}
      />
    </DemoLayout>
  );
}

