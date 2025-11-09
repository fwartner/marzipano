import { defineConfig } from 'vitest/config';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['buffer', 'process', 'util'],
    }),
  ],

  test: {
    // Test environment
    environment: 'jsdom',

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        'build/',
        'demos/',
        '**/*.config.js',
      ],
      threshold: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Test file patterns
    include: ['test/suite/**/*.js'],

    // Setup files
    setupFiles: [],

    // Test timeout
    testTimeout: 10000,

    // Mocha-compatible API
    // This allows us to use describe/it/before/after etc.
    api: {
      port: 7357,
    },

    // Browser mode for DOM testing
    browser: {
      enabled: false, // Can be enabled for browser-specific tests
      name: 'chrome',
    },

    // Reporter
    reporter: ['verbose'],

    // Watch mode configuration
    watch: false,
  },

  resolve: {
    extensions: ['.js', '.json'],
  },
});
