import js from '@eslint/js';
import globals from 'globals';

export default [
  // Base recommended rules
  js.configs.recommended,

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // Marzipano specific globals
        MARZIPANODEBUG: 'readonly',
      },
    },

    rules: {
      // Code style
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',

      // Best practices
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-throw-literal': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // ES6+
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',

      // Possible errors
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'error',
      'no-unreachable-loop': 'error',

      // Temporarily allow during migration
      'no-undef': 'warn', // Will be fixed when modules are converted
    },
  },

  // Test files specific configuration
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
        sinon: 'readonly',
      },
    },
    rules: {
      'no-unused-expressions': 'off', // Chai assertions use expressions
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'demos/',
      '*.config.js',
      'scripts/',
      'test/test_suite.js',
    ],
  },
];
