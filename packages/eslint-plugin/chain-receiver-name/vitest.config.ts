import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: import.meta.dirname,
    name: 'eslint-chain-receiver-name',
    watch: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['**/fixtures/**']
  }
});
