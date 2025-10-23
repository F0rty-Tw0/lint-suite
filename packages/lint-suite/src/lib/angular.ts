import globals from 'globals';
import { configs, processInlineTemplates } from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import type { Config } from 'eslint/config';

export const angular = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [...(configs.tsRecommended as Config[])],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2025,
        ...globals.node
      }
    },
    processor: processInlineTemplates,
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/use-injectable-provided-in': 'error'
    }
  }
]);
