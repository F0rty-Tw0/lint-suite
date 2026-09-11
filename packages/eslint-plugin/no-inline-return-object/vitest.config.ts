import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: import.meta.dirname,
    name: 'eslint-plugin-no-inline-return-object',
    watch: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['**/fixtures/**']
  }
});
