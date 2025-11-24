'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

export default function EmbeddedHotspotsPage() {
  const sceneRef = useRef<Marzipano.Scene | null>(null);
  const containerRef = useRef<any>(null);
  const [selectedSource, setSelectedSource] = useState<string>('');

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create source.
    const source = Marzipano.ImageUrlSource.fromString(
      "/media/outdoors/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: "/media/outdoors/preview.jpg" }
    );

    // Create geometry.
    const geometry = new Marzipano.CubeGeometry([
      { tileSize: 256, size: 256, fallbackOnly: true },
      { tileSize: 512, size: 512 },
      { tileSize: 512, size: 1024 },
      { tileSize: 512, size: 2048 },
      { tileSize: 512, size: 4096 }
    ]);

    // Create view.
    const limiter = Marzipano.RectilinearView.limit.traditional(4096, 100*Math.PI/180);
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
    scene.switchTo();

    // Get the hotspot container for scene.
    const container = scene.hotspotContainer();
    containerRef.current = container;

    // Create hotspot elements
    const iframespot = document.createElement('div');
    iframespot.id = 'iframespot';
    iframespot.innerHTML = '<div class="message">Select something to play!</div>';
    
    const iframeselect = document.createElement('ul');
    iframeselect.id = 'iframeselect';

    // Create hotspot with different sources.
    container.createHotspot(iframespot, { yaw: 0.0335, pitch: -0.102 },
      { perspective: { radius: 1640, extraTransforms: "rotateX(5deg)" }});
    container.createHotspot(iframeselect, { yaw: -0.35, pitch: -0.239 });

    // HTML sources.
    const hotspotHtml: Record<string, string> = {
      youtube: '<iframe id="youtube" width="1280" height="480" src="https://www.youtube.com/embed/a4YjKmsXyds?rel=0&amp;controls=0&amp;showinfo=0&amp;" frameBorder="0" allowFullScreen></iframe>',
      youtubeWithControls: '<iframe id="youtubeWithControls" width="1280" height="480" src="https://www.youtube.com/embed/a4YjKmsXyds?rel=0&amp;controls=1&amp;showinfo=0" frameBorder="0" allowFullScreen></iframe>',
      googleMaps: '<iframe id="googlemaps" width="1280" height="480" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9487.563699358636!2d-9.211273541013671!3d38.69789785451112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1ecf578f4d20e9%3A0x530952e38d140ae6!2sDigisfera+-+Fotografia+e+Inform%C3%A1tica%2C+Lda!5e1!3m2!1spt-PT!2spt!4v1429956174252" width="600" height="450" frameBorder="0" style={{border:0}}></iframe>',
      koloreyes: '<iframe id="koloreyes" src="https://eyes.kolor.com/video/i/kolor/54ef73cbaaa38b2943c8a7d72a4b00e6" type="text/html" width="1280" height="480" frameBorder="0" scrolling="no" allowFullScreen={true}> </iframe>'
    };

    // Switch sources when clicked.
    function switchHotspot(id: string) {
      if (iframespot) {
        iframespot.innerHTML = hotspotHtml[id];
        setSelectedSource(id);
      }
    }

    // Add click handlers to select list
    const items = [
      { id: 'googleMaps', label: 'Google Maps' },
      { id: 'youtube', label: 'YouTube' },
      { id: 'youtubeWithControls', label: 'YouTube (UI)' },
      { id: 'koloreyes', label: 'KolorEyes' }
    ];

    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.label;
      li.setAttribute('data-source', item.id);
      li.addEventListener('click', () => switchHotspot(item.id));
      iframeselect.appendChild(li);
    });
  };

  return (
    <DemoLayout 
      title="Embedded Hotspots" 
      description="Use embedded hotspots to overlay content from different sources on a 360° image (e.g. YouTube, Google Maps, Twitter)."
    >
      <div className="relative w-full h-full">
        <MarzipanoViewer 
          className="w-full h-full"
          onViewerReady={handleViewerReady}
        />
      </div>
    </DemoLayout>
  );
}

