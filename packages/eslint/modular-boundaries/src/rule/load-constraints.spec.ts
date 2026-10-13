import assert from 'node:assert/strict';

import { test } from 'vitest';

import type {
  DepConstraint,
  Project,
  WorkspaceModel
} from './common/modular-boundaries.type.ts';
import { constraintsFor } from './load-constraints.ts';
import { findConstraintViolation } from './utils/edge-constraints.util.ts';

const projectWithTags = (id: string, tags: string[]): Project => {
  const project: Project = {
    id,
    root: `/ws/${id}`,
    tags,
    declaredDependencies: [],
    hasOwnPackageJson: true
  };

  return project;
};

const modelOf = (projects: Project[]): WorkspaceModel => {
  const listing = { manifests: [], packageTurboFiles: [], sourceFiles: [] };
  const model: WorkspaceModel = {
    root: '/ws',
    projects,
    projectByRoot: new Map(),
    projectByPackageName: new Map(),
    pathAliases: [],
    listing,
    errors: [],
    readSet: new Map(),
    lastValidatedAt: 0
  };

  return model;
};

const web = projectWithTags('web', ['scope:web', 'type:ui']);
const api = projectWithTags('api', ['scope:api']);
const bare = projectWithTags('bare', []);
const model = modelOf([web, api, bare]);

test('sourceTag constraint matches projects carrying the tag', (): void => {
  const entry: DepConstraint = { sourceTag: 'scope:web' };
  const depConstraints = [entry];
  const set = constraintsFor(model, { depConstraints });

  assert.deepEqual(set.sourceMatches.get(web), set.constraints);
  assert.equal(set.sourceMatches.get(api), undefined);
  assert.deepEqual([...set.eslintSourceMatched], [web]);
});

test('sourceTag constraint translates to a source-side anyOf', (): void => {
  const entry: DepConstraint = {
    sourceTag: 'scope:web',
    onlyDependOnLibsWithTags: ['scope:shared'],
    notDependOnLibsWithTags: ['type:app'],
    allowedExternalImports: ['react'],
    bannedExternalImports: ['lodash']
  };
  const depConstraints = [entry];
  const set = constraintsFor(model, { depConstraints });
  const match = { anyOf: ['scope:web'] };
  const expected = {
    side: 'source',
    match,
    onlyTags: ['scope:shared'],
    notTags: ['type:app'],
    allowedExternal: ['react'],
    bannedExternal: ['lodash'],
    matchesPackageName: false,
    origin: 'eslint'
  };

  assert.deepEqual(set.constraints, [expected]);
});

test('allSourceTags requires every tag', (): void => {
  const entry: DepConstraint = { allSourceTags: ['scope:web', 'type:ui'] };
  const partial: DepConstraint = { allSourceTags: ['scope:api', 'type:ui'] };
  const depConstraints = [entry, partial];
  const set = constraintsFor(model, { depConstraints });
  const [allOfWeb] = set.constraints;
  const match = { allOf: ['scope:web', 'type:ui'] };

  assert.deepEqual(allOfWeb?.match, match);
  assert.deepEqual(set.sourceMatches.get(web), [allOfWeb]);
  assert.equal(set.sourceMatches.get(api), undefined);
});

test('* sourceTag matches an untagged project', (): void => {
  const entry: DepConstraint = { sourceTag: '*' };
  const depConstraints = [entry];
  const set = constraintsFor(model, { depConstraints });

  assert.ok(set.eslintSourceMatched.has(bare));
});

test('absent onlyDependOnLibsWithTags stays undefined', (): void => {
  const entry: DepConstraint = { sourceTag: 'scope:web' };
  const empty: DepConstraint = {
    sourceTag: 'scope:api',
    onlyDependOnLibsWithTags: []
  };
  const depConstraints = [entry, empty];
  const set = constraintsFor(model, { depConstraints });
  const [absent, present] = set.constraints;

  assert.equal(absent?.onlyTags, undefined);
  assert.ok(absent !== undefined && !('onlyTags' in absent));
  assert.deepEqual(present?.onlyTags, []);
});

test('sourceMatches keeps merge order', (): void => {
  const byScope: DepConstraint = { sourceTag: 'scope:web' };
  const byType: DepConstraint = { sourceTag: 'type:ui' };
  const byAll: DepConstraint = { allSourceTags: ['scope:web'] };
  const depConstraints = [byType, byScope, byAll];
  const set = constraintsFor(model, { depConstraints });

  assert.deepEqual(set.sourceMatches.get(web), set.constraints);
  assert.equal(set.sourceMatches.get(web)?.[0]?.match.anyOf?.[0], 'type:ui');
});

test('ESLint constraints produce no target matches or errors', (): void => {
  const entry: DepConstraint = { sourceTag: '*' };
  const depConstraints = [entry];
  const set = constraintsFor(model, { depConstraints });

  assert.equal(set.targetMatches.size, 0);
  assert.deepEqual(set.errors, []);
});

test('hasEslintConstraints is true for non-empty depConstraints', (): void => {
  const entry: DepConstraint = { sourceTag: 'scope:web' };
  const depConstraints = [entry];

  assert.ok(constraintsFor(model, { depConstraints }).hasEslintConstraints);
});

test('hasEslintConstraints is false for no or empty depConstraints', (): void => {
  const absent = constraintsFor(model, {});
  const empty = constraintsFor(model, { depConstraints: [] });

  assert.equal(absent.hasEslintConstraints, false);
  assert.equal(empty.hasEslintConstraints, false);
  assert.deepEqual(absent.constraints, []);
});

test('deep-equal options objects share one ConstraintSet', (): void => {
  const first: DepConstraint = { sourceTag: 'scope:web' };
  const second: DepConstraint = { sourceTag: 'scope:web' };
  const firstSet = constraintsFor(model, { depConstraints: [first] });
  const secondSet = constraintsFor(model, { depConstraints: [second] });

  assert.equal(firstSet, secondSet);
});

test('different options get different ConstraintSets', (): void => {
  const first: DepConstraint = { sourceTag: 'scope:web' };
  const second: DepConstraint = { sourceTag: 'scope:api' };
  const firstSet = constraintsFor(model, { depConstraints: [first] });
  const secondSet = constraintsFor(model, { depConstraints: [second] });

  assert.notEqual(firstSet, secondSet);
});

test('a rebuilt model gets a fresh ConstraintSet', (): void => {
  const entry: DepConstraint = { sourceTag: 'scope:web' };
  const options = { depConstraints: [entry] };
  const rebuilt = modelOf([web, api, bare]);
  const before = constraintsFor(model, options);
  const after = constraintsFor(rebuilt, options);

  assert.notEqual(before, after);
  assert.deepEqual(after.constraints, before.constraints);
});

const configModel = (
  rootTurbo: unknown,
  moonWorkspace?: unknown
): WorkspaceModel => {
  const base = modelOf([web, api, bare]);
  const configured: WorkspaceModel = { ...base, rootTurbo, moonWorkspace };

  return configured;
};

const turboModel = (tags: unknown): WorkspaceModel => {
  const boundaries = { tags };
  const rootTurbo = { boundaries };

  return configModel(rootTurbo);
};

test('turbo dependents.allow becomes a target-side onlyTags constraint', (): void => {
  const dependents = { allow: ['scope:web'] };
  const apiTag = { dependents };
  const set = constraintsFor(turboModel({ 'scope:api': apiTag }), {});
  const match = { anyOf: ['scope:api'] };
  const expected = {
    side: 'target',
    match,
    onlyTags: ['scope:web'],
    matchesPackageName: true,
    origin: 'turbo.json'
  };

  assert.deepEqual(set.constraints, [expected]);
  assert.deepEqual(set.targetMatches.get(api), set.constraints);
  assert.equal(set.sourceMatches.size, 0);
});

test('turbo lists match package names', (): void => {
  const dependencies = { allow: ['@ws/api'] };
  const webTag = { dependencies };
  const set = constraintsFor(turboModel({ 'scope:web': webTag }), {});
  const namedApi: Project = { ...api, packageName: '@ws/api' };
  const allowed = findConstraintViolation(set, {
    source: web,
    target: namedApi
  });
  const denied = findConstraintViolation(set, { source: web, target: api });

  assert.equal(allowed, undefined);
  assert.equal(denied?.messageId, 'onlyTagsConstraintViolation');
});

test('turbo allow: [] reports every project dependency', (): void => {
  const dependencies = { allow: [] };
  const webTag = { dependencies };
  const set = constraintsFor(turboModel({ 'scope:web': webTag }), {});
  const report = findConstraintViolation(set, { source: web, target: bare });

  assert.equal(report?.messageId, 'emptyOnlyTagsConstraintViolation');
});

test('translated constraints follow ESLint ones: turbo, then moon', (): void => {
  const dependencies = { deny: ['scope:api'] };
  const webTag = { dependencies };
  const tags = { 'type:ui': webTag, 'scope:web': webTag };
  const boundaries = { tags };
  const tagRelationships = { 'scope:web': ['scope:api'] };
  const constraints = { tagRelationships };
  const both = configModel({ boundaries }, { constraints });
  const entry: DepConstraint = { sourceTag: 'scope:web' };
  const set = constraintsFor(both, { depConstraints: [entry] });
  const origins = set.constraints.map((constraint) => constraint.origin);
  const matches = set.constraints.map((constraint) => constraint.match.anyOf);

  assert.deepEqual(origins, [
    'eslint',
    'turbo.json',
    'turbo.json',
    '.moon/workspace.yml'
  ]);
  assert.deepEqual(matches[1], ['type:ui']);
  assert.deepEqual([...set.eslintSourceMatched], [web]);
});

test('configSources.turbo: false ignores root turbo.json boundaries', (): void => {
  const dependencies = { deny: ['scope:api'] };
  const webTag = { dependencies };
  const configSources = { turbo: false };
  const set = constraintsFor(turboModel({ 'scope:web': webTag }), {
    configSources
  });

  assert.deepEqual(set.constraints, []);
});

test('a non-object dependencies entry yields a workspaceConfigError', (): void => {
  const brokenTag = { dependencies: ['scope:api'] };
  const dependents = { deny: 'scope:web' };
  const apiTag = { dependents };
  const dependencies = { deny: ['scope:api'] };
  const webTag = { dependencies };
  const tags = { broken: brokenTag, 'scope:api': apiTag, 'scope:web': webTag };
  const set = constraintsFor(turboModel(tags), {});
  const files = set.errors.map((error) => error.file);
  const sides = set.constraints.map((constraint) => constraint.side);

  assert.deepEqual(files, ['/ws/turbo.json', '/ws/turbo.json']);
  assert.match(set.errors[0]?.message ?? '', /broken\.dependencies/);
  assert.deepEqual(sides, ['source']);
});
