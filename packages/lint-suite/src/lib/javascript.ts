import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const jsFiles = ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'];

// `extends` intersects `files`, which would drop typescript-eslint's TS-only `eslint-recommended` block for JS files.
const typescriptEslintForJs = tseslint.configs.recommended.map((config) => {
  const scoped = { ...config, files: jsFiles };

  return scoped;
});

export const javascript = defineConfig([
  { ...js.configs.recommended, files: jsFiles },
  ...typescriptEslintForJs,
  {
    files: jsFiles,
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    }
  },
  {
    files: jsFiles,
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
]);
