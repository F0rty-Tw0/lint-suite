import { configs } from '@nx/eslint-plugin';
import { type ConfigArray, config } from 'typescript-eslint';

export const javascript: ConfigArray = config({
  files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
  extends: [...configs['flat/javascript']],
  rules: {}
});
