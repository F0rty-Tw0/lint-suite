import globals from 'globals';
import { configs, processInlineTemplates, tsPlugin } from 'angular-eslint';
import { type ConfigArray, config } from 'typescript-eslint';

export const angular: ConfigArray = config([
  {
    files: ['**/*.ts'],
    extends: [...configs.tsRecommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2025,
        ...globals.node
      }
    },
    processor: processInlineTemplates,
    plugins: { '@angular-eslint': tsPlugin },
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/use-injectable-provided-in': 'error'
    }
  }
]);
