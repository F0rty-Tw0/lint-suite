import assert from 'node:assert/strict';

import {
  ScriptTarget,
  createSourceFile,
  forEachChild,
  isIdentifier
} from 'typescript';
import type { Identifier, Node } from 'typescript';
import { test } from 'vitest';

import { isWriteOnly } from './typescript-write-targets.ts';

const targetName = 'target';

const isTargetIdentifier = (node: Node): node is Identifier => {
  const isIdentifierNode = isIdentifier(node);

  return isIdentifierNode && node.text === targetName;
};

const firstTarget = (code: string): Identifier => {
  const sourceFile = createSourceFile(
    'sample.ts',
    code,
    ScriptTarget.Latest,
    true
  );
  let found: Identifier | undefined;

  const visit = (node: Node): void => {
    const isTarget = isTargetIdentifier(node);

    if (isTarget) {
      found ??= node;
    }

    forEachChild(node, visit);
  };

  visit(sourceFile);
  assert.ok(found, `${targetName} must exist in: ${code}`);

  return found;
};

const writeOnlySamples: string[] = [
  'target = 1;',
  '(target) = 1;',
  'target! = 1;',
  '(target as number) = 1;',
  'delete target;',
  'for (target of items) {}',
  'for (target in items) {}',
  '[target] = items;',
  '({ key: target } = source);',
  '({ ...target } = source);'
];

const readSamples: string[] = [
  'read(target);',
  'const copy = target;',
  'target.child = 1;',
  'target += 1;',
  'const [first] = target;',
  'if (target === 1) {}'
];

test('treats every assignment and destructuring target as write-only', () => {
  for (const sample of writeOnlySamples) {
    assert.equal(isWriteOnly(firstTarget(sample)), true, sample);
  }
});

test('treats anything that reads the identifier as a read', () => {
  for (const sample of readSamples) {
    assert.equal(isWriteOnly(firstTarget(sample)), false, sample);
  }
});
