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
      'vitest/max-nested-describe': ['error', { max: 3 }],
      // Matcher improvements
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-contain': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/prefer-comparison-matcher': 'error',
      'vitest/prefer-strict-equal': 'warn',
      // Test quality
      'vitest/prefer-spy-on': 'error',
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/prefer-each': 'warn',
      'vitest/no-conditional-in-test': 'error',
      'vitest/no-test-return-statement': 'error',
      'vitest/prefer-mock-promise-shorthand': 'error'
    }
  }
]);
