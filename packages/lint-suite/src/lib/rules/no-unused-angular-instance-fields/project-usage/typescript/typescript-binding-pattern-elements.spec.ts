import assert from 'node:assert/strict';

import { forEachChild, isVariableDeclaration } from 'typescript';
import type { BindingPattern, Node } from 'typescript';
import { test } from 'vitest';

import {
  bindingPatternElements,
  isBindingPattern
} from './typescript-binding-pattern-elements.ts';
import { fixtureProgram } from '../utils/fixture-program.spec.util.ts';

const { checker, sourceFile } = fixtureProgram('destructuring', 'sample.ts');

const declaredPattern = (node: Node): BindingPattern | null => {
  const isDeclaration = isVariableDeclaration(node);

  if (!isDeclaration) return null;

  const isPattern = isBindingPattern(node.name);

  if (!isPattern) return null;

  return node.name;
};

const patterns: BindingPattern[] = [];

const collectPatterns = (node: Node): void => {
  const pattern = declaredPattern(node);

  if (pattern !== null) {
    patterns.push(pattern);
  }

  forEachChild(node, collectPatterns);
};

collectPatterns(sourceFile);
assert.equal(patterns.length, 3);

const [objectPattern, arrayPattern, nestedPattern] = patterns;

test('reads named, renamed, and rest elements of an object pattern', () => {
  const reads = bindingPatternElements(objectPattern, checker);
  const names = reads.map((read) => read.names);
  const rests = reads.map((read) => read.rest);

  assert.deepEqual(names, [['x'], ['label'], null]);
  assert.deepEqual(rests, [false, false, true]);
});

test('reads indexed elements of an array pattern and skips holes', () => {
  const reads = bindingPatternElements(arrayPattern, checker);
  const names = reads.map((read) => read.names);
  const rests = reads.map((read) => read.rest);

  assert.deepEqual(names, [['0'], null]);
  assert.deepEqual(rests, [false, false]);
});

test('exposes the nested pattern of an element', () => {
  const [read] = bindingPatternElements(nestedPattern, checker);

  assert.deepEqual(read.names, ['x']);
  assert.notEqual(read.nested, null);
});
