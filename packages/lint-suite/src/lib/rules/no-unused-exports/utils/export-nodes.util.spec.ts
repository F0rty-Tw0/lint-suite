import assert from 'node:assert/strict';

import { test } from 'vitest';

import { exportNodes } from './export-nodes.util.ts';
import { programOf } from '../../utils/parsed-program.spec.util.ts';

const namesOf = (code: string): string[] => {
  const nodes = exportNodes(programOf(code));
  const keys = nodes.keys();
  const names = [...keys];

  return names.sort();
};

test('maps an exported const declarator to its identifier', () => {
  assert.deepEqual(namesOf('export const value = 1;'), ['value']);
});

test('maps every declarator in an exported const statement', () => {
  assert.deepEqual(namesOf('export const a = 1, b = 2;'), ['a', 'b']);
});

test('maps an exported function declaration to its identifier', () => {
  assert.deepEqual(namesOf('export function greet() {}'), ['greet']);
});

test('maps an exported class declaration to its identifier', () => {
  assert.deepEqual(namesOf('export class Widget {}'), ['Widget']);
});

test('maps a named export specifier list', () => {
  const code = 'const a = 1;\nconst b = 2;\nexport { a, b };';

  assert.deepEqual(namesOf(code), ['a', 'b']);
});

test('maps an export default declaration to the name default', () => {
  assert.deepEqual(namesOf('export default 1;'), ['default']);
});

test('ignores a statement with no export modifier', () => {
  assert.deepEqual(namesOf('const local = 1;'), []);
});
