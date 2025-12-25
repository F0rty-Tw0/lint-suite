import playwrightEslint from 'eslint-plugin-playwright';
import { defineConfig } from 'eslint/config';

export const playwright = defineConfig([
  {
    ...playwrightEslint.configs['flat/recommended'],
    files: ['**/*.e2e.ts', '**/*.e2e.js'],
    rules: {
      ...playwrightEslint.configs['flat/recommended'].rules
    }
  }
]);
