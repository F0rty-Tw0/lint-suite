import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import ts from 'typescript';
import { afterEach, beforeEach, describe, it } from 'vitest';

import { ownPrivateSources } from './build-package-private-sources.ts';

const SOURCES: Record<string, string> = {
  'package/src/index.ts':
    "import { a } from '../../private/a.ts';\nimport { d } from '../../dependency/index.ts';\nexport const x = a + d;\n",
  'private/a.ts': "import { b } from './b.ts';\nexport const a = b;\n",
  'private/b.ts': 'export const b = 1;\n',
  'private/c.ts': 'export const c = 1;\n',
  'dependency/index.ts':
    "import { c } from '../private/c.ts';\nexport const d = c;\n"
};

const COMPILER_OPTIONS: ts.CompilerOptions = {
  allowImportingTsExtensions: true,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  noEmit: true
};

const writeSource = (root: string, [path, text]: [string, string]): void => {
  const target = join(root, path);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
};

describe('FEATURE: private sources a package ships declarations for', (): void => {
  describe('GIVEN a package importing one private module directly and another only through a dependency package', (): void => {
    let root: string;

    beforeEach((): void => {
      root = mkdtempSync(join(tmpdir(), 'build-package-private-sources-'));

      const entries = Object.entries(SOURCES);

      for (const entry of entries) {
        writeSource(root, entry);
      }
    });

    afterEach((): void => {
      rmSync(root, { force: true, recursive: true });
    });

    it('WHEN its private sources are collected THEN only modules reached from its own sources are kept', (): void => {
      const entryPoint = join(root, 'package/src/index.ts');
      const program = ts.createProgram([entryPoint], COMPILER_OPTIONS);
      const sourceRoot = join(root, 'package/src');
      const privateRoot = join(root, 'private');

      const sources = ownPrivateSources(program, sourceRoot, privateRoot);
      const expected = [join(root, 'private/a.ts'), join(root, 'private/b.ts')];

      assert.deepEqual(new Set(sources), new Set(expected));
    });
  });
});
