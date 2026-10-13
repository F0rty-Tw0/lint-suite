import assert from 'node:assert/strict';

import { onTestFinished, test } from 'vitest';

import {
  copyFixtureWorkspace,
  writeTempWorkspace
} from '../test/utils/fixture-workspace.spec.util.ts';
import { discoverProjectRoots } from './project-roots.util.ts';
import { listWorkspaceFiles } from './workspace-listing.util.ts';

import type {
  ConfigError,
  DiscoveredRoot
} from '../common/modular-boundaries.type.ts';
import type { FixtureWorkspace } from '../test/common/fixture-workspace.type.ts';

type DiscoveredWorkspace = {
  readonly file: (path: string) => string;
  readonly roots: DiscoveredRoot[];
  readonly errors: ConfigError[];
};

const discover = (workspace: FixtureWorkspace): DiscoveredWorkspace => {
  onTestFinished(workspace.dispose);

  const readSet = new Map<string, unknown>();
  const listing = listWorkspaceFiles(workspace.directory, readSet);
  const { roots, errors } = discoverProjectRoots(
    workspace.directory,
    listing,
    readSet
  );
  const result: DiscoveredWorkspace = { file: workspace.file, roots, errors };

  return result;
};

const discoverFixture = (name: string): DiscoveredWorkspace => {
  const workspace = copyFixtureWorkspace(name);

  return discover(workspace);
};

const discoverFiles = (files: Record<string, string>): DiscoveredWorkspace => {
  const workspace = writeTempWorkspace(files);

  return discover(workspace);
};

const rootPaths = (roots: DiscoveredRoot[]): string[] => {
  return roots.map((discovered) => discovered.root);
};

test('pnpm globs with a negated entry exclude that package', (): void => {
  const { file, roots, errors } = discoverFixture('pnpm-plain');
  const expected = [
    file('packages/data'),
    file('packages/feature'),
    file('packages/ui')
  ];

  assert.deepEqual(rootPaths(roots), expected);
  assert.deepEqual(errors, []);
});

test('npm workspaces object form with ./ prefixes is discovered', (): void => {
  const { file, roots } = discoverFixture('npm-workspaces');
  const expected = [file('libs/a'), file('libs/a-b')];

  assert.deepEqual(rootPaths(roots), expected);
});

test('every project.json directory is a project root', (): void => {
  const { file, roots } = discoverFixture('nx');
  const expected = [file('libs/named'), file('libs/shell'), file('libs/util')];

  assert.deepEqual(rootPaths(roots), expected);
});

test('moon globs match moon.yml directories and sources keep their map key', (): void => {
  const { file, roots } = discoverFixture('moon');
  const app: DiscoveredRoot = { root: file('apps/app'), moonId: 'app' };
  const comp: DiscoveredRoot = { root: file('packages/comp') };
  const named: DiscoveredRoot = { root: file('packages/named') };

  assert.deepEqual(roots, [app, comp, named]);
});

test('a moon projects map names each project directory by id', (): void => {
  const { file, roots } = discoverFiles({
    '.moon/workspace.yml': 'projects:\n  web: ./apps/site/\n',
    'apps/site/moon.yml': 'tags: []\n'
  });
  const web: DiscoveredRoot = { root: file('apps/site'), moonId: 'web' };

  assert.deepEqual(roots, [web]);
});

test('a glob list without include entries matches nothing, not even the root', (): void => {
  const { roots } = discoverFiles({
    '.moon/workspace.yml': "projects: ['!legacy']\n",
    'moon.yml': 'tags: []\n'
  });

  assert.deepEqual(roots, []);
});

test('the workspace root is not a project through package.json alone', (): void => {
  const { file, roots } = discoverFiles({
    'pnpm-workspace.yaml': "packages: ['**']\n",
    'package.json': '{ "name": "root" }',
    'packages/a/package.json': '{ "name": "a" }'
  });

  assert.deepEqual(rootPaths(roots), [file('packages/a')]);
});

test('the workspace root is a project when it holds a project.json', (): void => {
  const { file, roots } = discoverFiles({
    'pnpm-workspace.yaml': "packages: ['**']\n",
    'package.json': '{ "name": "root" }',
    'project.json': '{ "name": "root" }',
    'packages/a/package.json': '{ "name": "a" }'
  });
  const expected = [file('.'), file('packages/a')];

  assert.deepEqual(rootPaths(roots), expected);
});

test('a malformed pnpm-workspace.yaml yields a ConfigError naming the file', (): void => {
  const { file, roots, errors } = discoverFiles({
    'pnpm-workspace.yaml': 'packages: [unclosed\n',
    'packages/a/package.json': '{ "name": "a" }'
  });
  const files = errors.map((error) => error.file);

  assert.deepEqual(roots, []);
  assert.deepEqual(files, [file('pnpm-workspace.yaml')]);
});
