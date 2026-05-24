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
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '${dependency.type} is not allowed to be imported in ${file.type}',
          rules: [
            {
              from: { type: 'feature' },
              allow: [
                { to: { type: 'feature' } },
                { to: { type: 'ui' } },
                { to: { type: 'domain-logic' } },
                { to: { type: 'utils' } },
                { to: { type: 'common' } }
              ]
            },
            {
              from: { type: 'domain-logic' },
              allow: [
                { to: { type: 'domain-logic' } },
                { to: { type: 'data-access' } },
                { to: { type: 'utils' } },
                { to: { type: 'common' } }
              ]
            },
            {
              from: { type: 'data-access' },
              allow: [
                { to: { type: 'data-access' } },
                { to: { type: 'utils' } },
                { to: { type: 'common' } }
              ]
            },
            {
              from: { type: 'ui' },
              allow: [
                { to: { type: 'ui' } },
                { to: { type: 'utils' } },
                { to: { type: 'common' } }
              ]
            },
            {
              from: { type: 'utils' },
              allow: [
                { to: { type: 'utils' } },
                { to: { type: 'common' } }
              ]
            },
            {
              from: { type: 'common' },
              allow: [{ to: { type: 'common' } }]
            }
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.stories.ts'],
    rules: {
      'boundaries/dependencies': 'off'
    }
  }
]);
