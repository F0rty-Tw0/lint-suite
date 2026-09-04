import { configs } from '@nx/eslint-plugin';
import { defineConfig } from 'eslint/config';
import importPluginX from 'eslint-plugin-import-x';
import type { CompatibleConfigArray } from 'typescript-eslint';

const nxTypescript: CompatibleConfigArray = configs['flat/typescript'];

export const typescriptRecommended = defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    extends: [importPluginX.flatConfigs.typescript, ...nxTypescript]
  }
]);
