import Link from 'next/link';
import CodeBlock from '@/components/CodeBlock';
import FeatureCard from '@/components/FeatureCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-100 min-h-[85vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent" />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              Maintained by Pixel & Process from Lübeck, Germany
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-black tracking-tight">
              Marzipano-TS
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-600 mb-6 font-light">
              A 360° media viewer for the modern web
            </p>
            
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Originally created by Google, now maintained by Pixel & Process. 
              Uses WebGL to render panoramic images with support for multiple geometries and projection types.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/demos"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg"
              >
                <span>View Demos</span>
                <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <a
                href="#installation"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-105 text-gray-900 shadow-sm"
              >
                <span>Get Started</span>
              </a>
              <a
                href="https://github.com/Pixel-Process-UG/marzipano-ts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-105 text-gray-900 shadow-sm"
              >
                <span>GitHub</span>
                <span className="inline-block opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black">
                About Marzipano-TS
              </h2>
              <div className="w-24 h-1 bg-black mx-auto" />
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 md:p-12 border border-gray-200 shadow-sm">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Marzipano-TS is a powerful JavaScript library for creating immersive 360° media experiences on the web. 
                  Built with WebGL, it provides high-performance rendering of panoramic images and videos with support for 
                  multiple geometries including cube maps, equirectangular projections, and flat images.
                </p>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  This project was originally created by Google and is now maintained as a fork by 
                  <a href="https://pixelandprocess.de/" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-700 mx-1 underline underline-offset-2 font-medium">
                    Pixel & Process
                  </a>
                  , a digital agency from Lübeck, Germany. We're committed to keeping this project alive and up-to-date 
                  with modern web standards.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Key features include WebGL rendering, multiple geometry support, WebXR integration for VR/AR experiences, 
                  spatial audio, interactive hotspots, smooth transitions, and comprehensive touch gesture support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section id="installation" className="py-24 md:py-32 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black">
                Installation
              </h2>
              <div className="w-24 h-1 bg-black mx-auto" />
              <p className="text-lg text-gray-600 mt-6 max-w-2xl mx-auto">
                Get started with Marzipano-TS in minutes
              </p>
            </div>
            
            <div className="space-y-12">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-semibold mb-6 text-black">Install via npm</h3>
                <CodeBlock>
{`npm install marzipano-ts`}
                </CodeBlock>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-semibold mb-6 text-black">ES Modules (Recommended)</h3>
                <CodeBlock>
{`import { 
  Viewer, 
  Scene, 
  ImageUrlSource, 
  RectilinearView, 
  CubeGeometry 
} from 'marzipano';`}
                </CodeBlock>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-semibold mb-6 text-black">CommonJS (Legacy)</h3>
                <CodeBlock>
{`const { 
  Viewer, 
  Scene, 
  ImageUrlSource, 
  RectilinearView, 
  CubeGeometry 
} = require('marzipano');`}
                </CodeBlock>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-2xl font-semibold mb-6 text-black">Quick Start</h3>
                <CodeBlock>
{`import { Viewer, Scene, ImageUrlSource, RectilinearView, CubeGeometry } from 'marzipano';

// Create viewer
const viewer = new Viewer(document.getElementById('pano'));

// Create scene
const scene = viewer.createScene({
  source: ImageUrlSource.fromString('/path/to/image.jpg'),
  geometry: new CubeGeometry([{ tileSize: 256, size: 256 }]),
  view: new RectilinearView({ fov: Math.PI / 2 })
});

// Display scene
scene.switchTo();`}
                </CodeBlock>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black">
              Key Features
            </h2>
            <div className="w-24 h-1 bg-black mx-auto mb-6" />
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to build immersive 360° experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Multiple Geometries"
              description="Support for cube maps, equirectangular projections, and flat images with automatic level-of-detail management."
            />
            <FeatureCard
              title="Interactive Hotspots"
              description="Add interactive elements to your panoramas with support for custom styling, z-index, and accessibility features."
            />
            <FeatureCard
              title="WebXR Support"
              description="Full WebXR integration for immersive VR and AR experiences with head tracking and controller support."
            />
            <FeatureCard
              title="WebGL Rendering"
              description="High-performance rendering using WebGL for smooth 60fps experiences even with high-resolution panoramas."
            />
            <FeatureCard
              title="Spatial Audio"
              description="Position-based audio support for immersive experiences with 3D spatial sound positioning."
            />
            <FeatureCard
              title="Smooth Transitions"
              description="Beautiful scene transitions with crossfade, zoom morph, and customizable easing functions."
            />
            <FeatureCard
              title="Touch Gestures"
              description="Comprehensive touch gesture support including pinch-to-zoom, drag, and multi-touch interactions."
            />
            <FeatureCard
              title="Video Support"
              description="Play 360° videos with support for multiple resolution levels and adaptive streaming."
            />
            <FeatureCard
              title="Performance Optimized"
              description="Built-in performance monitoring, memory management, and LRU texture caching for optimal performance."
            />
          </div>
        </div>
      </section>

      {/* Contribution Section */}
      <section className="py-24 md:py-32 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black">
                Contributing
              </h2>
              <div className="w-24 h-1 bg-black mx-auto" />
            </div>
            
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-200 shadow-sm">
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                We welcome contributions to keep Marzipano-TS alive and up-to-date with modern web standards! 
                Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.
              </p>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-black">Getting Started</h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    Before starting work on a larger contribution, please get in touch through our 
                    <a href="https://github.com/Pixel-Process-UG/marzipano-ts/issues" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-700 mx-1 underline underline-offset-2 font-medium">
                      issue tracker
                    </a>
                    to coordinate and avoid duplicate work.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-black">Development Setup</h3>
                  <CodeBlock>
{`# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch`}
                  </CodeBlock>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-black">Contribution Guidelines</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 leading-relaxed">
                    <li>Follow existing code style and conventions</li>
                    <li>Include tests for new features or bug fixes</li>
                    <li>Update documentation as needed</li>
                    <li>Ensure compatibility with the Apache 2.0 license</li>
                    <li>All submissions require review via GitHub pull requests</li>
                  </ul>
                </div>
                
                <div className="pt-4">
                  <a
                    href="https://github.com/Pixel-Process-UG/marzipano-ts/blob/main/CONTRIBUTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-900 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <span>Read Full Contributing Guide</span>
                    <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pixel & Process Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black">
                Maintained by Pixel & Process
              </h2>
              <div className="w-24 h-1 bg-black mx-auto" />
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 md:p-12 border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-4 text-black">
                    Pixel & Process
                  </h3>
                  <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                    Pixel & Process is a digital agency from Lübeck, Germany, specializing in web development, 
                    design systems, and automation workflows. We're passionate about open-source software and 
                    committed to maintaining projects that benefit the developer community.
                  </p>
                  <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                    When Google discontinued active development of Marzipano, we took on the responsibility 
                    of maintaining this fork to ensure it continues to work with modern web standards and 
                    receives necessary updates and bug fixes.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="https://pixelandprocess.de/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-900 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <span>Visit Pixel & Process</span>
                      <span className="inline-block group-hover:translate-x-1 transition-transform">↗</span>
                    </a>
                    <a
                      href="https://github.com/Pixel-Process-UG"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300 hover:scale-105 text-gray-900 shadow-sm"
                    >
                      <span>Our GitHub</span>
                      <span className="inline-block opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">↗</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-gray-200 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 justify-items-center md:justify-items-start">
              {/* Brand Section */}
              <div className="lg:col-span-1">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">Marzipano-TS</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    by Pixel & Process
                  </p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  A 360° media viewer for the modern web. Built with WebGL for immersive panoramic experiences.
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://github.com/Pixel-Process-UG/marzipano-ts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group"
                    aria-label="GitHub"
                  >
                    <svg className="w-5 h-5 text-gray-700 group-hover:text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Navigation Links */}
              <div>
                <h4 className="text-sm font-semibold text-black mb-4 uppercase tracking-wider">Navigation</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/" className="text-gray-600 hover:text-black transition-colors text-sm inline-flex items-center gap-2 group">
                      <span>Home</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/demos" className="text-gray-600 hover:text-black transition-colors text-sm inline-flex items-center gap-2 group">
                      <span>Demos</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </Link>
                  </li>
                  <li>
                    <a href="#installation" className="text-gray-600 hover:text-black transition-colors text-sm inline-flex items-center gap-2 group">
                      <span>Installation</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-sm font-semibold text-black mb-4 uppercase tracking-wider">Resources</h4>
                <ul className="space-y-3">
                  <li>
                    <a 
                      href="https://github.com/Pixel-Process-UG/marzipano-ts" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-600 hover:text-black transition-colors text-sm inline-flex items-center gap-2 group"
                    >
                      <span>GitHub Repository</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://github.com/Pixel-Process-UG/marzipano-ts/issues" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-600 hover:text-black transition-colors text-sm inline-flex items-center gap-2 group"
                    >
                      <span>Report an Issue</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://github.com/Pixel-Process-UG/marzipano-ts/blob/main/CONTRIBUTING.md" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-600 hover:text-black transition-colors text-sm inline-flex items-center gap-2 group"
                    >
                      <span>Contributing Guide</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Maintained By */}
              <div>
                <h4 className="text-sm font-semibold text-black mb-4 uppercase tracking-wider">Maintained by</h4>
                <ul className="space-y-3">
                  <li>
                    <a 
                      href="https://pixelandprocess.de/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-600 hover:text-black transition-colors text-sm inline-flex items-center gap-2 group font-medium"
                    >
                      <span>Pixel & Process</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                    </a>
                  </li>
                  <li className="text-sm text-gray-500">
                    Lübeck, Germany
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Pixel & Process UG (haftungsbeschränkt). All rights reserved.
                </p>
                <p className="text-sm text-gray-500">
                  Licensed under{' '}
                  <a 
                    href="https://www.apache.org/licenses/LICENSE-2.0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-black underline underline-offset-2"
                  >
                    Apache 2.0
                  </a>
                  . Originally created by Google Inc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
