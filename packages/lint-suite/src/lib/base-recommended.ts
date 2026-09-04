import { configs } from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import importPluginX from 'eslint-plugin-import-x';

export const baseRecommended = defineConfig([
  { extends: [...configs['flat/base']] },
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts'
    ],
    extends: [importPluginX.flatConfigs.recommended]
  },
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts'
    ],
    extends: [stylistic.configs.recommended]
  }
]);
