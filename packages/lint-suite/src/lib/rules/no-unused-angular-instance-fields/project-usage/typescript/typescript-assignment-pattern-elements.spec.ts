import assert from 'node:assert/strict';

import {
  SyntaxKind,
  forEachChild,
  isArrayLiteralExpression,
  isBinaryExpression,
  isObjectLiteralExpression
} from 'typescript';
import type { Node } from 'typescript';
import { test } from 'vitest';

import { assignmentPatternElements } from './typescript-assignment-pattern-elements.ts';
import type { AssignmentPattern } from '../common/project-usage.type.ts';
import { fixtureProgram } from '../utils/fixture-program.spec.util.ts';

const { checker, sourceFile } = fixtureProgram('destructuring', 'sample.ts');

const patternOf = (left: Node): AssignmentPattern | null => {
  const isArrayTarget = isArrayLiteralExpression(left);
  const isObjectTarget = isObjectLiteralExpression(left);
  const isPatternTarget = isArrayTarget || isObjectTarget;

  if (!isPatternTarget) return null;

  return left;
};

const assignmentTarget = (node: Node): AssignmentPattern | null => {
  const isBinary = isBinaryExpression(node);

  if (!isBinary) return null;

  const isAssignment = node.operatorToken.kind === SyntaxKind.EqualsToken;

  if (!isAssignment) return null;

  return patternOf(node.left);
};

const targets: AssignmentPattern[] = [];

const collectTargets = (node: Node): void => {
  const target = assignmentTarget(node);

  if (target !== null) {
    targets.push(target);
  }

  forEachChild(node, collectTargets);
};

collectTargets(sourceFile);
assert.equal(targets.length, 2);

const [objectTarget, arrayTarget] = targets;

test('reads the property names of an object assignment target', () => {
  const reads = assignmentPatternElements(objectTarget, checker);
  const names = reads.map((read) => read.names);
  const nested = reads.map((read) => read.nested);

  assert.deepEqual(names, [['x'], ['label']]);
  assert.deepEqual(nested, [null, null]);
});

test('reads the indexes of an array assignment target', () => {
  const reads = assignmentPatternElements(arrayTarget, checker);
  const names = reads.map((read) => read.names);

  assert.deepEqual(names, [['0']]);
});
