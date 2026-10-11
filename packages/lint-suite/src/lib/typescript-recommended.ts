import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importPluginX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export const typescriptRecommended = defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    extends: [
      importPluginX.flatConfigs.typescript,
      js.configs.recommended,
      ...tseslint.configs.recommended,
      {
        languageOptions: {
          parser: tseslint.parser,
          ecmaVersion: 2020,
          sourceType: 'module',
          parserOptions: { tsconfigRootDir: process.cwd() }
        }
      },
      {
        rules: {
          '@typescript-eslint/explicit-member-accessibility': 'off',
          '@typescript-eslint/explicit-module-boundary-types': 'off',
          '@typescript-eslint/explicit-function-return-type': 'off',
          '@typescript-eslint/no-parameter-properties': 'off',
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
    ]
  }
]);
