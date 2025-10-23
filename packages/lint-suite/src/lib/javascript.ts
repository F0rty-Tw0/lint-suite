import { configs } from '@nx/eslint-plugin';
import { defineConfig } from 'eslint/config';
import type { Config } from 'eslint/config';

export const javascript = defineConfig({
  files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
  extends: [...(configs['flat/javascript'] as Config[])]
});
