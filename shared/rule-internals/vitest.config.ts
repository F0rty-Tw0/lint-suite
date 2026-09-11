import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'rule-internals',
    root: import.meta.dirname,
    watch: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['**/fixtures/**'],
    passWithNoTests: false
  }
});
