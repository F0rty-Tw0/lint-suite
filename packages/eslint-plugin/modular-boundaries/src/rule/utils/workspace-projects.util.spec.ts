import assert from 'node:assert/strict';

import { onTestFinished, test } from 'vitest';

import { writeTempWorkspace } from '../test/utils/fixture-workspace.spec.util.ts';
import { listWorkspaceFiles } from './workspace-listing.util.ts';
import {
  packageNameIndex,
  projectRootIndex,
  readWorkspaceProjects
} from './workspace-projects.util.ts';

import type { ConfigError } from '../common/modular-boundaries.type.ts';

test('projects are indexed by root and by package name when they have one', (): void => {
  const workspace = writeTempWorkspace({
    'nx.json': '{}',
    'libs/a/project.json': '{ "name": "a" }',
    'libs/b/package.json': '{ "name": "@acme/b" }',
    'libs/b/project.json': '{ "name": "b" }',
    'libs/c/project.json': '{ broken'
  });
  const readSet = new Map<string, unknown>();
  const errors: ConfigError[] = [];

  onTestFinished(workspace.dispose);

  const listing = listWorkspaceFiles(workspace.directory, readSet);
  const projects = readWorkspaceProjects(
    workspace.directory,
    listing,
    readSet,
    errors
  );
  const byRoot = projectRootIndex(projects);
  const byName = packageNameIndex(projects);
  const files = errors.map((error) => error.file);

  assert.equal(byRoot.get(workspace.file('libs/a'))?.id, 'a');
  assert.deepEqual([...byName.keys()], ['@acme/b']);
  assert.deepEqual(files, [workspace.file('libs/c/project.json')]);
});
