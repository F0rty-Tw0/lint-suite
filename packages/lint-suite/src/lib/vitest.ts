import vitestEslint from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';
export const vitest = defineConfig([
  {
    files: ['**/*.spec.ts', '**/*.spec.js', '**/*.test.ts', '**/*.test.js'],
    plugins: {
      vitestEslint
    },
    rules: {
      ...vitestEslint.configs.recommended.rules,
      'vitest/max-nested-describe': ['error', { max: 3 }]
    }
  }
]);
