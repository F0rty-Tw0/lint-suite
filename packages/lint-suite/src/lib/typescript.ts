import nx from '@nx/eslint-plugin';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importPluginX from 'eslint-plugin-import-x';

import explicitAccessibilityRule from './rules/explicit-accessibility.js';

const localTypescriptRules = {
  rules: {
    'explicit-accessibility': explicitAccessibilityRule
  }
};

export const typescript = [
  // NOTE: Checks for 'prettier' and 'eslint-plugin-prettier'
  importPluginX.flatConfigs.typescript,
  ...nx.configs['flat/typescript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    plugins: { local: localTypescriptRules },
    rules: {
      'local/explicit-accessibility': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-use-before-define': 'error',

      // A. Eliminating `any` (already covered by strict-type-checked, but explicit for clarity)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // B. Explicit Annotations (partially covered, explicit module boundaries is key)
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      // Consider enabling if maximum explicitness is desired, even if verbose:

      // C. Null/Undefined Safety (Requires strictNullChecks)
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // D. Promise Handling (Supplementing plugin:promise/recommended)
      '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: true }
      ],
      '@typescript-eslint/no-misused-promises': 'warn', // Already in recommended-type-checked
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/await-thenable': 'error', // Already in recommended-type-checked

      // E. Best Practices & Potential Errors (Some covered by presets, fine-tuning here)
      '@typescript-eslint/no-inferrable-types': 'warn', // Keep as warn or disable if inference is preferred
      '@typescript-eslint/no-var-requires': 'error', // Use ES modules
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true }
      ], // Allow numbers/booleans in templates
      '@typescript-eslint/restrict-plus-operands': 'error', // Enforce consistent types for '+'
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error', // Ensure switch on unions is exhaustive
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true }
      ],
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }], // Prefer dot notation where possible

      // F. Consistency & Style (Some covered by stylistic-type-checked)
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'objectLiteralProperty',
          modifiers: ['requiresQuotes'],
          format: null
        },
        {
          selector: 'objectLiteralProperty',
          format: ['camelCase', 'snake_case', 'PascalCase']
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow'
        },
        { selector: 'default', format: ['camelCase'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'property',
          modifiers: ['requiresQuotes'],
          format: null
        },
        {
          selector: 'property',
          format: ['camelCase', 'PascalCase', 'snake_case']
        }
      ],
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
          pathGroups: [
            {
              pattern: '@angular/**',
              group: 'builtin',
              position: 'before'
            },
            {
              pattern: '@nestjs/**',
              group: 'builtin',
              position: 'before'
            },
            {
              pattern: '@*/shared/**',
              group: 'internal',
              position: 'before'
            },
            {
              pattern: '@*/frontend/**',
              group: 'internal',
              position: 'after'
            },
            {
              pattern: '@*/backend/**',
              group: 'internal',
              position: 'after'
            }
          ],
          pathGroupsExcludedImportTypes: ['@angular/**', '@nestjs/**'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ],
      'import-x/no-unresolved': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/prefer-default-export': 'off',
      'import-x/no-useless-path-segments': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/first': 'error',
      'import-x/no-mutable-exports': 'error'
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: 'tsconfig.base.json'
        })
      ]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    },
    rules: {
      '@typescript-eslint/prefer-readonly': 'error'
    }
  },
  {
    files: ['**/*.action.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off'
    }
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unbound-method': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off'
    }
  },
  {
    files: ['**/*.stories.ts'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/naming-convention': 'off'
    }
  }
];
