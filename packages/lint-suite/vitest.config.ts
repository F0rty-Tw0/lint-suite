import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    root: import.meta.dirname,
    watch: false,
    testTimeout: 30_000,
    include: ['src/**/*.spec.ts'],
    exclude: ['**/fixtures/**']
  }
});
