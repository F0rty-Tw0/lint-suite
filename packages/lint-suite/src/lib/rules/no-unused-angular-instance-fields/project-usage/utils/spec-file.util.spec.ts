import assert from 'node:assert/strict';
import { test } from 'vitest';

import { isSpecFile } from './spec-file.util.js';

const specFileNames: string[] = [
  'component.spec.ts',
  'component.spec.tsx',
  'component.spec.js',
  'component.spec.jsx',
  'component.spec.cts',
  'component.spec.mts',
  'component.spec.cjs',
  'component.spec.mjs',
  '/project/src/deeply/nested/widget.spec.ts',
  'C:\\project\\src\\widget.spec.ts'
];

const sourceFileNames: string[] = [
  '',
  'component.ts',
  'component.test.ts',
  'spec.ts',
  'component.spec.html',
  'component.spec.ts.map',
  'componentspec.ts',
  '/project/src/spec/widget.ts'
];

test('treats every spec suffix and extension as a spec file', () => {
  for (const fileName of specFileNames) {
    assert.equal(isSpecFile(fileName), true, fileName);
  }
});

test('leaves ordinary source file names alone', () => {
  for (const fileName of sourceFileNames) {
    assert.equal(isSpecFile(fileName), false, fileName);
  }
});
