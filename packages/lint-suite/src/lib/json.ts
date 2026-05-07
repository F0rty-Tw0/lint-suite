import jsonPlugin from '@eslint/json';
import { defineConfig } from 'eslint/config';

export const json = defineConfig([
  {
    plugins: { json: jsonPlugin }
  },
  {
    files: ['**/*.json'],
    language: 'json/json',
    extends: [jsonPlugin.configs.recommended]
  }
]);
