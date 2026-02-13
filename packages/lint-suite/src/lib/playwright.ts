import playwrightEslint from 'eslint-plugin-playwright';
import { defineConfig } from 'eslint/config';

export const playwright = defineConfig([
  {
    ...playwrightEslint.configs['flat/recommended'],
    files: ['**/*.e2e.ts', '**/*.e2e.js'],
    rules: {
      ...playwrightEslint.configs['flat/recommended'].rules,
      // Locator best practices
      'playwright/prefer-locator': 'error',
      'playwright/prefer-native-locators': 'error',
      'playwright/no-nth-methods': 'warn',
      // Matcher improvements
      'playwright/prefer-to-be': 'error',
      'playwright/prefer-to-have-count': 'error',
      'playwright/prefer-to-have-length': 'error',
      'playwright/prefer-comparison-matcher': 'error',
      // Test structure
      'playwright/prefer-hooks-on-top': 'error',
      'playwright/require-top-level-describe': 'warn'
    }
  }
]);
