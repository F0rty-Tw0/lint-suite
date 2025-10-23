import playwrightEslint from 'eslint-plugin-playwright';
import { defineConfig } from 'eslint/config';

export const playwright = defineConfig([
  {
    ...playwrightEslint.configs['flat/recommended'],
    files: ['**/*.test.ts', '**/*.test.js'],
    rules: {
      ...playwrightEslint.configs['flat/recommended'].rules
    }
  }
]);
