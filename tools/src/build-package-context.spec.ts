import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, it } from 'vitest';

import {
  entryNamesFromExports,
  packageAssets
} from './build-package-context.ts';

describe('FEATURE: build package entries and assets', (): void => {
  describe('GIVEN package exports', (): void => {
    it('WHEN the package is an umbrella THEN every subpath except package.json is an entry', (): void => {
      const exports = {
        './package.json': './package.json',
        './eslint': './src/eslint.ts',
        './stylelint': './src/stylelint.ts',
        './prettier': './src/prettier.ts'
      };

      const entryNames = entryNamesFromExports(exports);

      assert.deepEqual(entryNames, ['eslint', 'stylelint', 'prettier']);
    });

    it('WHEN the package is a rule THEN the root export is the index entry', (): void => {
      const exports = {
        '.': './src/index.ts',
        './package.json': './package.json'
      };

      const entryNames = entryNamesFromExports(exports);

      assert.deepEqual(entryNames, ['index']);
    });

    it('WHEN the package has root and subpaths THEN entries keep export order', (): void => {
      const exports = {
        '.': './src/index.ts',
        './local-plugin': './src/local-plugin.ts',
        './eslint': './src/eslint.ts',
        './package.json': './package.json'
      };

      const entryNames = entryNamesFromExports(exports);

      assert.deepEqual(entryNames, ['index', 'local-plugin', 'eslint']);
    });
  });

  describe('GIVEN a package root', (): void => {
    let packageRoot: string;

    beforeEach((): void => {
      packageRoot = mkdtempSync(join(tmpdir(), 'build-package-assets-'));
    });

    afterEach((): void => {
      rmSync(packageRoot, { force: true, recursive: true });
    });

    it('WHEN MISSING.md exists THEN it is published with the standard assets', (): void => {
      writeFileSync(join(packageRoot, 'MISSING.md'), '# Missing\n');

      const assets = packageAssets(packageRoot);

      assert.deepEqual(assets, [
        'README.md',
        'LICENSE',
        'CHANGELOG.md',
        'MISSING.md'
      ]);
    });

    it('WHEN MISSING.md is absent THEN only the standard assets are published', (): void => {
      const assets = packageAssets(packageRoot);

      assert.deepEqual(assets, ['README.md', 'LICENSE', 'CHANGELOG.md']);
    });
  });
});
