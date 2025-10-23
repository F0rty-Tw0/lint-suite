import jsonEslint from 'eslint-plugin-json';
import { defineConfig } from 'eslint/config';

export const json = defineConfig([
  {
    files: ['**/*.json'],
    extends: [jsonEslint.configs.recommended]
  }
]);
