import { configs } from '@nx/eslint-plugin';
import { defineConfig } from 'eslint/config';
import type { CompatibleConfigArray } from 'typescript-eslint';

const nxJavascript: CompatibleConfigArray = configs['flat/javascript'];

export const javascript = defineConfig({
  files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
  extends: nxJavascript
});
