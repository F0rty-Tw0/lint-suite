import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: import.meta.dirname,
    name: 'eslint-modular-boundaries',
    watch: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['**/fixtures/**'],
    // Fixture workspaces live in tmp; a disk cache would fill the repo's own cache with their paths.
    env: { LINT_SUITE_CACHE: '0' }
  }
});
