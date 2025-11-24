import Link from 'next/link';

const demos = [
  {
    category: 'Basic Panoramas',
    items: [
      { name: 'Equirectangular', path: '/demos/equirect', description: 'Display an equirectangular image' },
      { name: 'Cube Single Resolution', path: '/demos/cube-single-res', description: 'Display a cubemap with a single resolution level' },
      { name: 'Cube Multi-Resolution', path: '/demos/cube-multi-res', description: 'Display a cubemap with multiple resolution levels' },
      { name: 'Flat', path: '/demos/flat', description: 'Display a flat (non-panoramic) image' },
    ]
  },
  {
    category: 'Hotspots',
    items: [
      { name: 'Hotspots v2', path: '/demos/hotspots-v2', description: 'Enhanced hotspots with z-index, occlusion, and accessibility' },
      { name: 'Embedded Hotspots', path: '/demos/embedded-hotspots', description: 'Overlay content from different sources (YouTube, Google Maps, etc.)' },
      { name: 'Hotspot Rect', path: '/demos/hotspot-rect', description: 'Hotspots with Rect Effect' },
      { name: 'Hotspot Styles', path: '/demos/hotspot-styles', description: 'Showcase various hotspot styles and effects' },
    ]
  },
  {
    category: 'Advanced Features',
    items: [
      { name: 'Transitions', path: '/demos/transitions', description: 'Scene transition effects' },
      { name: 'Video', path: '/demos/video', description: 'Video playback in panoramas' },
      { name: 'Touch Gestures', path: '/demos/touch-gestures', description: 'Touch gesture controls' },
      { name: 'Device Orientation', path: '/demos/device-orientation', description: 'Device orientation controls' },
      { name: 'Spatial Audio', path: '/demos/spatial-audio', description: 'Spatial audio support' },
    ]
  },
  {
    category: 'XR/VR',
    items: [
      { name: 'WebXR Immersive', path: '/demos/webxr-immersive', description: 'WebXR immersive mode' },
    ]
  },
  {
    category: 'Special',
    items: [
      { name: 'Anaglyph', path: '/demos/anaglyph', description: 'Anaglyph 3D effect' },
      { name: 'Editable', path: '/demos/editable', description: 'Editable panorama layers' },
      { name: 'Sample Tour', path: '/demos/sample-tour', description: 'Interactive tour example' },
      { name: 'Side by Side', path: '/demos/side-by-side', description: 'Side-by-side comparison' },
      { name: 'Performance Telemetry', path: '/demos/performance-telemetry', description: 'Performance monitoring' },
      { name: 'Next Gen Features', path: '/demos/next-gen-features', description: 'Next generation features' },
      { name: 'Fallback Tiles', path: '/demos/fallback-tiles', description: 'Fallback tile handling' },
    ]
  },
];

export default function DemosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </Link>
        </nav>

        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Marzipano Demos
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A collection of 360° media viewer demos powered by Marzipano, built with Next.js and Tailwind CSS
          </p>
        </header>

        <div className="space-y-12">
          {demos.map((category, categoryIndex) => (
            <section key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-gray-700 pb-2">
                {category.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.items.map((demo, index) => (
                  <Link
                    key={index}
                    href={demo.path}
                    className="group block bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all duration-200 hover:scale-105 hover:shadow-xl border border-gray-700 hover:border-blue-500"
                  >
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                      {demo.name}
                    </h3>
                    <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                      {demo.description}
                    </p>
                    <div className="mt-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Demo →
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>Powered by <a href="https://www.marzipano.net" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Marzipano</a>, <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Next.js</a>, and <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Tailwind CSS</a></p>
        </footer>
      </div>
    </div>
  );
}

