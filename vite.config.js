import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Required for some legacy code patterns
      include: ['buffer', 'process', 'util'],
    }),
  ],

  // Development server configuration
  server: {
    port: 8080,
    open: false,
    cors: true,
  },

  // Build configuration for library
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'Marzipano',
      formats: ['es', 'umd'],
      fileName: (format) => `marzipano.${format}.js`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
        // Preserve the original export structure
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
  },

  // Resolve configuration
  resolve: {
    extensions: ['.js', '.json'],
  },

  // Optimization
  optimizeDeps: {
    include: ['bowser', 'gl-matrix', 'hammerjs', 'minimal-event-emitter'],
  },
});
