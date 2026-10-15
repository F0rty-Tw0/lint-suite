import { defineConfig } from 'vitest/config';

const CACHE_ENV = 'LINT_SUITE_CACHE';

export default defineConfig({
  test: {
    root: import.meta.dirname,
    name: 'eslint-modular-boundaries',
    watch: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['**/fixtures/**'],
    // Fixture workspaces live in tmp; a disk cache would fill the repo's own cache with their paths.
    env: { [CACHE_ENV]: '0' }
  }
});
