import assert from 'node:assert/strict';

import { test } from 'vitest';

import type {
  ConfigError,
  Constraint
} from '../common/modular-boundaries.type.ts';

import {
  moonConstraints,
  turboConstraints
} from './config-constraints.util.ts';

const TURBO_FILE = '/ws/turbo.json';
const MOON_FILE = '/ws/.moon/workspace.yml';

const turboWithTags = (tags: unknown): unknown => {
  const boundaries = { tags };
  const turbo = { boundaries };

  return turbo;
};

const moonWithRelationships = (tagRelationships: unknown): unknown => {
  const constraints = { tagRelationships };
  const workspace = { constraints };

  return workspace;
};

test('turbo dependencies.deny becomes a source-side notTags constraint', (): void => {
  const dependencies = { deny: ['scope:api'] };
  const webTag = { dependencies };
  const errors: ConfigError[] = [];
  const turbo = turboWithTags({ 'scope:web': webTag });
  const constraints = turboConstraints(turbo, TURBO_FILE, errors);
  const match = { anyOf: ['scope:web'] };
  const expected = {
    side: 'source',
    match,
    notTags: ['scope:api'],
    matchesPackageName: true,
    origin: 'turbo.json'
  };

  assert.deepEqual(constraints, [expected]);
  assert.deepEqual(errors, []);
});

test('turbo emits dependencies before dependents, allow before deny', (): void => {
  const dependencies = { deny: ['b'], allow: ['a'] };
  const dependents = { deny: ['d'], allow: ['c'] };
  const webTag = { dependents, dependencies };
  const turbo = turboWithTags({ web: webTag });
  const constraints = turboConstraints(turbo, TURBO_FILE, []);
  const summaryOf = (constraint: Constraint): string => {
    const tags = constraint.onlyTags ?? constraint.notTags ?? [];

    return `${constraint.side}:${tags.join()}`;
  };
  const summaries = constraints.map(summaryOf);

  assert.deepEqual(summaries, ['source:a', 'source:b', 'target:c', 'target:d']);
});

test('turbo without boundaries yields nothing', (): void => {
  const errors: ConfigError[] = [];
  const pipeline = { tasks: {} };
  const missing = turboConstraints(undefined, TURBO_FILE, errors);
  const noBoundaries = turboConstraints(pipeline, TURBO_FILE, errors);

  assert.deepEqual([...missing, ...noBoundaries], []);
  assert.deepEqual(errors, []);
});

test('turbo shape errors name the file and skip only the bad entry', (): void => {
  const errors: ConfigError[] = [];
  const brokenTag = { dependents: 'x' };
  const dependencies = { allow: 'x', deny: ['y'] };
  const okTag = { dependencies };
  const turbo = turboWithTags({ broken: brokenTag, ok: okTag, bad: 1 });
  const constraints = turboConstraints(turbo, TURBO_FILE, errors);
  const messages = errors.map((error) => error.message);
  const files = new Set(errors.map((error) => error.file));

  assert.equal(constraints.length, 1);
  assert.deepEqual(constraints[0]?.notTags, ['y']);
  assert.deepEqual([...files], [TURBO_FILE]);
  assert.equal(messages.length, 3);
  assert.match(messages[0] ?? '', /boundaries\.tags\.broken\.dependents/);
});

test('a non-object boundaries or tags yields one error', (): void => {
  const errors: ConfigError[] = [];
  const brokenBoundaries = { boundaries: [] };

  turboConstraints(brokenBoundaries, TURBO_FILE, errors);
  turboConstraints(turboWithTags('x'), TURBO_FILE, errors);

  assert.equal(errors.length, 2);
});

test('an empty moon relationship list allows every dependency', (): void => {
  const errors: ConfigError[] = [];
  const workspace = moonWithRelationships({ next: [] });

  assert.deepEqual(moonConstraints(workspace, MOON_FILE, errors), []);
  assert.deepEqual(errors, []);
});

test('moon tagRelationships becomes source-side onlyTags that include the source tag', (): void => {
  const errors: ConfigError[] = [];
  const workspace = moonWithRelationships({ next: ['react-ui'] });
  const constraints = moonConstraints(workspace, MOON_FILE, errors);
  const match = { anyOf: ['next'] };
  const expected = {
    side: 'source',
    match,
    onlyTags: ['react-ui', 'next'],
    matchesPackageName: false,
    origin: '.moon/workspace.yml'
  };

  assert.deepEqual(constraints, [expected]);
  assert.deepEqual(errors, []);
});

test('a non-array moon relationship list yields a workspaceConfigError', (): void => {
  const errors: ConfigError[] = [];
  const relationships = { next: 'react-ui', app: ['lib'] };
  const workspace = moonWithRelationships(relationships);
  const constraints = moonConstraints(workspace, MOON_FILE, errors);
  const files = errors.map((error) => error.file);

  assert.deepEqual(files, [MOON_FILE]);
  assert.deepEqual(constraints[0]?.match.anyOf, ['app']);
  assert.equal(constraints.length, 1);
});

test('moon without constraints yields nothing', (): void => {
  const errors: ConfigError[] = [];
  const projects = { projects: ['libs/*'] };

  assert.deepEqual(moonConstraints(projects, MOON_FILE, errors), []);
  assert.deepEqual(errors, []);
});
