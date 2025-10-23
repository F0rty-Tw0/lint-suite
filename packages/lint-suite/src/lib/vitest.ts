import vitestEslint from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';

const vitestPlugin: Record<string, object> = {
  vitest: vitestEslint
};

export const vitest = defineConfig([
  {
    files: ['**/*.spec.ts', '**/*.spec.js', '**/*.test.ts', '**/*.test.js'],
    plugins: vitestPlugin,
    rules: {
      ...vitestEslint.configs.recommended.rules,
      'vitest/max-nested-describe': ['error', { max: 3 }]
    }
  }
]);
