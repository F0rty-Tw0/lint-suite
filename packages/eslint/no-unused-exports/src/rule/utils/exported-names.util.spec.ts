import assert from 'node:assert/strict';

import { ScriptTarget, createSourceFile } from 'typescript';
import { test } from 'vitest';

import { exportedNames } from './exported-names.util.ts';

const namesIn = (code: string): string[] => {
  const sourceFile = createSourceFile('sample.ts', code, ScriptTarget.Latest);
  const [statement] = sourceFile.statements;

  assert.ok(statement, 'sample must contain a statement');

  return exportedNames(statement);
};

test('names an exported function declaration', () => {
  assert.deepEqual(namesIn('export function greet() {}'), ['greet']);
});

test('names an exported class declaration', () => {
  assert.deepEqual(namesIn('export class Widget {}'), ['Widget']);
});

test('names an exported type alias', () => {
  assert.deepEqual(namesIn('export type Shape = { id: string };'), ['Shape']);
});

test('names an exported interface', () => {
  assert.deepEqual(namesIn('export interface Shape { id: string }'), ['Shape']);
});

test('names an exported enum', () => {
  assert.deepEqual(namesIn('export enum Color { Red }'), ['Color']);
});

test('names every declarator in an exported const statement', () => {
  assert.deepEqual(namesIn('export const a = 1, b = 2;'), ['a', 'b']);
});

test('names an exported default declaration as default', () => {
  assert.deepEqual(namesIn('export default function () {}'), ['default']);
});

test('returns nothing for a statement with no export modifier', () => {
  assert.deepEqual(namesIn('const local = 1;'), []);
});
