import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // External packages for server components
  serverExternalPackages: ['marzipano'],
  // Disable static optimization for demo pages (they require client-side only code)
  output: 'standalone',
  // Use webpack instead of turbopack for better compatibility with local packages
  webpack: (config, { isServer }) => {
    // Resolve marzipano to the local package
    config.resolve.alias = {
      ...config.resolve.alias,
      'marzipano': path.resolve(__dirname, '../src/index.js'),
    };
    
    // Enable WebGL/WebGPU support
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
