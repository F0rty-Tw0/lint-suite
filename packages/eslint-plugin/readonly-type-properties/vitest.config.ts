import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: import.meta.dirname,
    name: 'eslint-plugin-readonly-type-properties',
    watch: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['**/fixtures/**']
  }
});
