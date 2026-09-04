import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

const pathGroups = [
  { pattern: '@angular/**', group: 'builtin', position: 'before' },
  { pattern: '@nestjs/**', group: 'builtin', position: 'before' },
  { pattern: '@shared/**', group: 'internal', position: 'before' },
  { pattern: '@backend/**', group: 'internal', position: 'before' },
  { pattern: '@frontend/**', group: 'internal', position: 'before' },
  { pattern: '@*/shared/**', group: 'internal', position: 'before' },
  { pattern: '@*/frontend/**', group: 'internal', position: 'after' },
  { pattern: '@*/backend/**', group: 'internal', position: 'after' }
];

export const typescriptImports = defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    rules: {
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'unknown'
          ],
          pathGroups,
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ],
      // TypeScript already checks these four; import-x would re-parse every import with a parser resolved by name, which fails under pnpm.
      'import-x/namespace': 'off',
      'import-x/default': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-unresolved': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/prefer-default-export': 'off',
      'import-x/no-useless-path-segments': ['error', { noUselessIndex: true }],
      'import-x/newline-after-import': 'error',
      'import-x/first': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-cycle': ['error', { maxDepth: 2, ignoreExternal: true }],
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/no-anonymous-default-export': 'error'
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true
        })
      ]
    }
  }
]);
