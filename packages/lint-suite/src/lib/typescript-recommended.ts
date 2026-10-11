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
        languageOptions: { parserOptions: { tsconfigRootDir: process.cwd() } }
      },
      { rules: { '@typescript-eslint/adjacent-overload-signatures': 'error' } }
    ]
  }
]);
