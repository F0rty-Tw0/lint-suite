import assert from 'node:assert/strict';

import { test } from 'vitest';

import { findConstraintViolation } from './edge-constraints.util.ts';
import type {
  Constraint,
  ConstraintSet,
  EdgeReport,
  Project
} from '../common/modular-boundaries.type.ts';
import {
  constraintSetStub,
  constraintStub,
  projectStub,
  sourceConstraintSetStub
} from '../test/utils/check-edge.spec.util.ts';

const app = projectStub('app', { tags: ['type:app'] });
const lib = projectStub('lib', { tags: ['type:ui'] });
const bare = projectStub('bare');

const violation = (
  overrides: Partial<Constraint>,
  target: Project
): EdgeReport | undefined => {
  const constraints = sourceConstraintSetStub(overrides, app);

  return findConstraintViolation(constraints, { source: app, target });
};

const messageOf = (
  constraints: ConstraintSet,
  target: Project
): string | undefined => {
  const report = findConstraintViolation(constraints, { source: app, target });

  return report?.messageId;
};

test('onlyTags passes when the target carries one of the tags', (): void => {
  assert.equal(
    violation({ onlyTags: ['type:util', 'type:ui'] }, lib),
    undefined
  );
});

test('onlyTags [] reports only when the target has tags (Nx)', (): void => {
  const data = { source: 'app', target: 'lib', origin: 'eslint' };
  const expected: EdgeReport = {
    messageId: 'emptyOnlyTagsConstraintViolation',
    data
  };

  assert.deepEqual(violation({ onlyTags: [] }, lib), expected);
  assert.equal(violation({ onlyTags: [] }, bare), undefined);
});

test('turbo-origin onlyTags [] reports even for an untagged target', (): void => {
  const report = violation({ onlyTags: [], origin: 'turbo.json' }, bare);

  assert.equal(report?.messageId, 'emptyOnlyTagsConstraintViolation');
});

test('notTags reports notTagsConstraintViolation', (): void => {
  const notTags = ['type:ui', 'type:data'];
  const data = {
    source: 'app',
    target: 'lib',
    side: 'target',
    project: 'lib',
    tags: "'type:ui', 'type:data'",
    origin: 'eslint'
  };
  const expected: EdgeReport = {
    messageId: 'notTagsConstraintViolation',
    data
  };

  assert.deepEqual(violation({ notTags }, lib), expected);
  assert.equal(violation({ notTags }, bare), undefined);
});

test('target-side constraint checks the source project', (): void => {
  const constraint = constraintStub({
    side: 'target',
    onlyTags: ['type:feature'],
    origin: 'turbo.json'
  });
  const constraints = constraintSetStub({
    constraints: [constraint],
    targetMatches: [[lib, [constraint]]]
  });
  const report = findConstraintViolation(constraints, {
    source: app,
    target: lib
  });
  const data = {
    source: 'app',
    target: 'lib',
    side: 'source',
    project: 'app',
    tags: "'type:feature'",
    origin: 'turbo.json'
  };
  const expected: EdgeReport = {
    messageId: 'onlyTagsConstraintViolation',
    data
  };

  assert.deepEqual(report, expected);
  assert.equal(messageOf(constraints, bare), undefined);
});

test('step 7 interleaves source- and target-side constraints by merge order', (): void => {
  const deny = constraintStub({
    side: 'target',
    notTags: ['type:app'],
    origin: 'turbo.json'
  });
  const allow = constraintStub({ onlyTags: ['type:util'] });
  const constraints = constraintSetStub({
    constraints: [deny, allow],
    sourceMatches: [[app, [allow]]],
    targetMatches: [[lib, [deny]]]
  });

  assert.equal(messageOf(constraints, lib), 'notTagsConstraintViolation');
});

test('matchesPackageName lets a turbo notTags entry match the target package name', (): void => {
  const turbo: Partial<Constraint> = {
    notTags: ['@ws/lib'],
    origin: 'turbo.json'
  };
  const matching = violation({ ...turbo, matchesPackageName: true }, lib);

  assert.equal(matching?.messageId, 'notTagsConstraintViolation');
  assert.equal(violation(turbo, lib), undefined);
});

test('matchesPackageName lets a turbo onlyTags entry match the target package name', (): void => {
  const overrides: Partial<Constraint> = {
    onlyTags: ['@ws/bare'],
    origin: 'turbo.json',
    matchesPackageName: true
  };

  assert.equal(violation(overrides, bare), undefined);
});
