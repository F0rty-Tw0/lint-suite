import boundariesPlugin from 'eslint-plugin-boundaries';
import { defineConfig } from 'eslint/config';

export const boundaries = defineConfig([
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts'
    ],
    plugins: {
      boundaries: boundariesPlugin
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'feature',
          pattern: '**/feature/**'
        },
        {
          type: 'data-access',
          pattern: '**/data-access/**'
        },
        {
          type: 'domain-logic',
          pattern: '**/domain-logic/**'
        },
        {
          type: 'ui',
          pattern: '**/ui/**'
        },
        {
          type: 'common',
          pattern: '**/common/**'
        },
        {
          type: 'utils',
          pattern: '**/utils/**'
        }
      ],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true
        }
      }
    },
    rules: {
      ...boundariesPlugin.configs.recommended.rules,
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message:
            '${dependency.type} is not allowed to be imported in ${file.type}',
          rules: [
            {
              from: 'feature',
              allow: ['feature', 'ui', 'domain-logic', 'utils', 'common']
            },
            {
              from: 'domain-logic',
              allow: ['domain-logic', 'data-access', 'utils', 'common']
            },
            {
              from: 'data-access',
              allow: ['data-access', 'utils', 'common']
            },
            {
              from: 'ui',
              allow: ['ui', 'utils', 'common']
            },
            {
              from: 'utils',
              allow: ['utils', 'common']
            },
            {
              from: 'common',
              allow: ['common']
            }
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.stories.ts'],
    rules: {
      'boundaries/element-types': 'off'
    }
  }
]);
