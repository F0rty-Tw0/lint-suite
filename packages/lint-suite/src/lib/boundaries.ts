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
            '{{to.element.types}} is not allowed to be imported in {{from.element.types}}',
          policies: [
            {
              from: { element: { type: 'feature' } },
              allow: [
                { to: { element: { type: 'feature' } } },
                { to: { element: { type: 'ui' } } },
                { to: { element: { type: 'domain-logic' } } },
                { to: { element: { type: 'utils' } } },
                { to: { element: { type: 'common' } } }
              ]
            },
            {
              from: { element: { type: 'domain-logic' } },
              allow: [
                { to: { element: { type: 'domain-logic' } } },
                { to: { element: { type: 'data-access' } } },
                { to: { element: { type: 'utils' } } },
                { to: { element: { type: 'common' } } }
              ]
            },
            {
              from: { element: { type: 'data-access' } },
              allow: [
                { to: { element: { type: 'data-access' } } },
                { to: { element: { type: 'utils' } } },
                { to: { element: { type: 'common' } } }
              ]
            },
            {
              from: { element: { type: 'ui' } },
              allow: [
                { to: { element: { type: 'ui' } } },
                { to: { element: { type: 'utils' } } },
                { to: { element: { type: 'common' } } }
              ]
            },
            {
              from: { element: { type: 'utils' } },
              allow: [
                { to: { element: { type: 'utils' } } },
                { to: { element: { type: 'common' } } }
              ]
            },
            {
              from: { element: { type: 'common' } },
              allow: [{ to: { element: { type: 'common' } } }]
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
