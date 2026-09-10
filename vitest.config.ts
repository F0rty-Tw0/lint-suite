import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    projects: [
      'packages/lint-suite/vitest.config.ts',
      'packages/eslint-plugin/*/vitest.config.ts',
      'packages/stylelint/*/vitest.config.ts',
      'shared/*/vitest.config.ts',
      'tools/vitest.config.ts'
    ]
  }
});
