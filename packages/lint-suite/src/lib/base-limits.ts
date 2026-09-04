import { defineConfig } from 'eslint/config';

export const baseLimits = defineConfig([
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.html'
    ],
    rules: {
      'max-lines': [
        'error',
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true
        }
      ]
    }
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.spec.js',
      '**/*.test.js',
      '**/*.e2e.ts',
      '**/*.e2e.js'
    ],
    rules: {
      'max-lines-per-function': 'off',
      complexity: ['warn', { max: 3 }],
      'max-lines': [
        'error',
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true
        }
      ]
    }
  },
  {
    files: ['**/*.action.ts'],
    rules: {
      'max-classes-per-file': 'off'
    }
  },
  {
    files: ['**/*.state.ts'],
    rules: {
      'class-methods-use-this': 'off'
    }
  }
]);
