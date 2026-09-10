import { defineConfig } from 'eslint/config';

import { typescriptConfig } from '../eslint.config.base.ts';

const config = defineConfig(typescriptConfig, {
  files: ['**/*.ts'],
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      projectService: false,
      tsconfigRootDir: import.meta.dirname
    }
  }
});

export default config;
