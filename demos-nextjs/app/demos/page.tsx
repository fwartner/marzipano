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
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors text-sm font-medium"
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
        </nav>

        {/* Header */}
        <header className="text-center mb-16 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black tracking-tight">
            Marzipano-TS Demos
          </h1>
          <div className="w-24 h-1 bg-black mx-auto mb-6" />
          <p className="text-xl text-gray-600">
            A collection of 360° media viewer demos powered by Marzipano-TS
          </p>
        </header>

        {/* Demo Categories */}
        <div className="space-y-16">
          {demos.map((category, categoryIndex) => (
            <section key={categoryIndex} className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl font-bold text-black">
                  {category.category}
                </h2>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-500 font-medium">
                  {category.items.length} {category.items.length === 1 ? 'demo' : 'demos'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.items.map((demo, index) => (
                  <Link
                    key={index}
                    href={demo.path}
                    className="group relative bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-400 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                        <span className="text-white text-sm">→</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-3 text-black group-hover:text-gray-700 transition-colors pr-12">
                      {demo.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors">
                      {demo.description}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-medium group-hover:text-gray-700 transition-colors">
                        View Demo →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-gray-200 text-center max-w-4xl mx-auto">
          <p className="text-gray-500 text-sm">
            Powered by{' '}
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-black underline underline-offset-2 font-medium">
              Next.js
            </a>
            {' '}and{' '}
            <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-black underline underline-offset-2 font-medium">
              Tailwind CSS
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
