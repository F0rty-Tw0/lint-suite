import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const javascript = defineConfig(
  {
    files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    extends: [js.configs.recommended],
    // Parser and plugin stay so consumer @typescript-eslint/* rules set without `files` still run on JS.
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      'no-unused-expressions': 'error',
      'no-array-constructor': 'error',
      'no-empty-function': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }]
    }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { globalReturn: true } }
    }
  }
);
