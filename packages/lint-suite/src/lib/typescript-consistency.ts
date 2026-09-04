import { defineConfig } from 'eslint/config';

export const typescriptConsistency = defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    rules: {
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
          selector: ['objectLiteralProperty', 'objectLiteralMethod'],
          modifiers: ['requiresQuotes'],
          format: null
        },
        {
          selector: 'objectLiteralMethod',
          format: ['camelCase', 'PascalCase']
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
      ]
    }
  }
]);
