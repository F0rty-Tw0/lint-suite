import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: import.meta.dirname,
    name: 'eslint-test-file-shape',
    watch: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['**/fixtures/**']
  }
});
