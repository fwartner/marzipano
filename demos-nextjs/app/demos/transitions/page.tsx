'use client';

import { useEffect, useRef, useState } from 'react';
import * as Marzipano from 'marzipano';
import DemoLayout from '@/components/DemoLayout';
import MarzipanoViewer from '@/components/MarzipanoViewer';

function linear(val: number) { return val; }

const transitionFunctions: Record<string, (ease?: (val: number) => number) => (val: number, newScene: Marzipano.Scene) => void> = {
  opacity: function(ease) {
    ease = ease || linear;
    return function(val: number, newScene: Marzipano.Scene) {
      val = ease(val);
      newScene.layer().setEffects({ opacity: val });
    }
  },
  fromRight: function(ease) {
    ease = ease || linear;
    return function(val: number, newScene: Marzipano.Scene) {
      val = ease(val);
      newScene.layer().setEffects({ rect: { relativeX: 1 - val } });
    }
  },
  fromTop: function(ease) {
    ease = ease || linear;
    return function(val: number, newScene: Marzipano.Scene) {
      val = ease(val);
      newScene.layer().setEffects({ rect: { relativeY: -1 + val } });
    }
  },
  fromBottom: function(ease) {
    ease = ease || linear;
    return function(val: number, newScene: Marzipano.Scene) {
      val = ease(val);
      newScene.layer().setEffects({ rect: { relativeY: 1 - val } });
    }
  },
};

const easing: Record<string, (val: number) => number> = {
  linear: linear,
  easeIn: (val: number) => val * val,
  easeOut: (val: number) => val * (2 - val),
  easeInOut: (val: number) => val < 0.5 ? 2 * val * val : -1 + (4 - 2 * val) * val,
};

export default function TransitionsPage() {
  const scene1Ref = useRef<Marzipano.Scene | null>(null);
  const scene2Ref = useRef<Marzipano.Scene | null>(null);
  const currentSceneRef = useRef<Marzipano.Scene | null>(null);
  const [selectedEasing, setSelectedEasing] = useState('linear');
  const [selectedFunction, setSelectedFunction] = useState('opacity');
  const [transitionTime, setTransitionTime] = useState(1000);

  const handleViewerReady = (viewer: Marzipano.Viewer) => {
    // Create a geometry to be shared by the two scenes.
    const geometry = new Marzipano.CubeGeometry([
      { tileSize: 256, size: 256, fallbackOnly: true },
      { size: 512, tileSize: 512 },
      { size: 1024, tileSize: 512 },
      { size: 2048, tileSize: 512 }
    ]);

    // Create a view limiter to be shared by the two scenes.
    const limiter = Marzipano.RectilinearView.limit.traditional(2048, 120*Math.PI/180);

    const urlPrefix = "/media";

    // Set up the first scene.
    const view1 = new Marzipano.RectilinearView(null, limiter);
    const source1 = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/electricity-museum/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/electricity-museum/preview.jpg" }
    );
    const scene1 = viewer.createScene({
      source: source1,
      geometry: geometry,
      view: view1,
      pinFirstLevel: true
    });
    scene1Ref.current = scene1;

    // Set up the second scene.
    const view2 = new Marzipano.RectilinearView(null, limiter);
    const source2 = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/jeronimos/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/jeronimos/preview.jpg" }
    );
    const scene2 = viewer.createScene({
      source: source2,
      geometry: geometry,
      view: view2,
      pinFirstLevel: true
    });
    scene2Ref.current = scene2;

    // Display the initial scene.
    currentSceneRef.current = scene1;
    scene1.switchTo({ transitionDuration: 0 });
  };

  const nextScene = () => {
    if (currentSceneRef.current === scene1Ref.current) {
      currentSceneRef.current = scene2Ref.current;
      return scene2Ref.current!;
    } else {
      currentSceneRef.current = scene1Ref.current;
      return scene1Ref.current!;
    }
  };

  const changeScene = () => {
    if (!currentSceneRef.current) return;
    
    const fun = transitionFunctions[selectedFunction];
    const ease = easing[selectedEasing];
    const transitionUpdate = fun ? fun(ease) : undefined;
    
    nextScene().switchTo({
      transitionDuration: transitionTime,
      transitionUpdate: transitionUpdate
    });
  };

  return (
    <DemoLayout 
      title="Transitions" 
      description="Scene transition effects"
    >
      <div className="flex h-full">
        <div className="flex-1">
          <MarzipanoViewer 
            className="w-full h-full"
            onViewerReady={handleViewerReady}
          />
        </div>
        <div className="w-80 bg-gray-800 text-white p-4">
          <h2 className="text-xl font-bold mb-4">Transition Controls</h2>
          
          <div className="mb-4">
            <label className="block mb-2">
              Function:
              <select 
                value={selectedFunction}
                onChange={(e) => setSelectedFunction(e.target.value)}
                className="w-full mt-1 px-2 py-1 text-black rounded"
              >
                {Object.keys(transitionFunctions).map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-4">
            <label className="block mb-2">
              Easing:
              <select 
                value={selectedEasing}
                onChange={(e) => setSelectedEasing(e.target.value)}
                className="w-full mt-1 px-2 py-1 text-black rounded"
              >
                {Object.keys(easing).map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-4">
            <label className="block mb-2">
              Duration (ms):
              <input 
                type="number" 
                value={transitionTime}
                onChange={(e) => setTransitionTime(parseInt(e.target.value))}
                className="w-full mt-1 px-2 py-1 text-black rounded"
              />
            </label>
          </div>

          <button 
            onClick={changeScene}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Transition to Next Scene
          </button>
        </div>
      </div>
    </DemoLayout>
  );
}

