import assert from 'node:assert/strict';

import { onTestFinished, test } from 'vitest';

import { readProject } from './read-project.util.ts';
import type {
  DiscoveredRoot,
  Project,
  ProjectRead
} from '../common/modular-boundaries.type.ts';
import type { FixtureWorkspace } from '../test/common/fixture-workspace.type.ts';
import {
  copyFixtureWorkspace,
  writeTempWorkspace
} from '../test/utils/fixture-workspace.spec.util.ts';

const fixture = (name: string): FixtureWorkspace => {
  const workspace = copyFixtureWorkspace(name);

  onTestFinished(workspace.dispose);

  return workspace;
};

const tempWorkspace = (files: Record<string, string>): FixtureWorkspace => {
  const workspace = writeTempWorkspace(files);

  onTestFinished(workspace.dispose);

  return workspace;
};

const discoveredRoot = (root: string, moonId?: string): DiscoveredRoot => {
  const plain: DiscoveredRoot = { root };

  if (moonId === undefined) return plain;

  const withMoonId: DiscoveredRoot = { root, moonId };

  return withMoonId;
};

const readAt = (
  workspace: FixtureWorkspace,
  path: string,
  moonId?: string
): ProjectRead => {
  const root = workspace.file(path);
  const discovered = discoveredRoot(root, moonId);

  return readProject(workspace.directory, discovered, new Map());
};

const projectAt = (
  workspace: FixtureWorkspace,
  path: string,
  moonId?: string
): Project => {
  const { project, errors } = readAt(workspace, path, moonId);

  assert.deepEqual(errors, []);
  assert.ok(project);

  return project;
};

test('project id prefers project.json name, then nx.name', (): void => {
  const workspace = fixture('nx');
  const shell = projectAt(workspace, 'libs/shell');
  const named = projectAt(workspace, 'libs/named');

  assert.equal(shell.id, 'shell');
  assert.equal(named.id, 'named');
  assert.equal(named.packageName, '@acme/named');
});

test('glob-discovered moon project without id uses its folder name', (): void => {
  const workspace = fixture('moon');
  const comp = projectAt(workspace, 'packages/comp');

  assert.equal(comp.id, 'comp');
  assert.equal(comp.packageName, '@moon/comp');
  assert.deepEqual(comp.tags, ['npm:public', 'react']);
});

test('a moon projects map key wins over moon.yml id and folder name', (): void => {
  const workspace = tempWorkspace({ 'apps/site/moon.yml': 'id: other\n' });
  const site = projectAt(workspace, 'apps/site', 'web');

  assert.equal(site.id, 'web');
});

test('moon.yml id wins over the folder name', (): void => {
  const workspace = tempWorkspace({ 'apps/site/moon.yml': 'id: web\n' });
  const site = projectAt(workspace, 'apps/site');

  assert.equal(site.id, 'web');
});

test('tags are the union of project.json, nx.tags, top-level tags, turbo.json, moon.yml and npm:* tags', (): void => {
  const workspace = fixture('nx');
  const project = projectAt(workspace, 'libs/shell');
  const expected = [
    'moon:y',
    'npm:public',
    'npm:ui',
    'owner:core',
    'scope:web',
    'turbo:x',
    'type:app',
    'type:feature'
  ];

  assert.deepEqual(project.tags.toSorted(), expected);
});

test('a project without package.json declares the root package.json dependencies', (): void => {
  const workspace = fixture('nx');
  const util = projectAt(workspace, 'libs/util');

  assert.equal(util.hasOwnPackageJson, false);
  assert.deepEqual(util.declaredDependencies, ['rxjs']);
  assert.deepEqual(util.tags, []);
});

test('own package.json dependency fields are the declared dependencies', (): void => {
  const dependencies = { b: '1' };
  const devDependencies = { c: '1' };
  const peerDependencies = { b: '1', d: '1' };
  const optionalDependencies = { e: '1' };
  const manifest = {
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies
  };
  const manifestText = JSON.stringify(manifest);
  const workspace = tempWorkspace({
    'package.json': '{ "dependencies": { "root-only": "1" } }',
    'packages/a/package.json': manifestText
  });
  const a = projectAt(workspace, 'packages/a');

  assert.equal(a.hasOwnPackageJson, true);
  assert.deepEqual(a.declaredDependencies.toSorted(), ['b', 'c', 'd', 'e']);
});

test('a private package without names falls back to its relative root as id', (): void => {
  const workspace = tempWorkspace({
    'packages/a/package.json': '{ "private": true }'
  });
  const a = projectAt(workspace, 'packages/a');

  assert.equal(a.id, 'packages/a');
  assert.equal(a.root, workspace.file('packages/a'));
  assert.deepEqual(a.tags, ['npm:private']);
});

test('a malformed package.json yields a ConfigError naming the file', (): void => {
  const workspace = tempWorkspace({
    'packages/a/package.json': '{ "name": ',
    'packages/a/project.json': '{ "name": "a" }'
  });
  const { project, errors } = readAt(workspace, 'packages/a');
  const files = errors.map((error) => error.file);

  assert.deepEqual(files, [workspace.file('packages/a/package.json')]);
  assert.ok(project);
  assert.equal(project.id, 'a');
  assert.equal(project.hasOwnPackageJson, false);
});

test('a root whose only manifest is malformed is not a project', (): void => {
  const workspace = tempWorkspace({ 'packages/a/package.json': '{ "name": ' });
  const { project, errors } = readAt(workspace, 'packages/a');

  assert.equal(project, undefined);
  assert.equal(errors.length, 1);
});
