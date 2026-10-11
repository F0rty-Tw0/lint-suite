import assert from 'node:assert/strict';
import { mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';

import { onTestFinished, test, vi } from 'vitest';

import {
  copyFixtureWorkspace,
  writeTempWorkspace
} from './test/utils/fixture-workspace.spec.util.ts';
import {
  buildWorkspaceModel,
  projectForFile,
  workspaceModelFor
} from './workspace-model.ts';

import type { PathAlias } from './common/modular-boundaries.type.ts';
import type { FixtureWorkspace } from './test/common/fixture-workspace.type.ts';

const PAST_WINDOW_MS = 10_001;

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

const useFakeClock = (): void => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
};

const rewrite = (path: string, text: string): void => {
  const future = new Date(Date.now() + 60_000);

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  utimesSync(path, future, future);
};

const projectIds = (workspace: FixtureWorkspace): string[] => {
  const model = buildWorkspaceModel(workspace.directory);

  return model.projects.map((project) => project.id);
};

test('duplicate package names become one config error per pair and both projects are dropped', (): void => {
  const workspace = tempWorkspace({
    'pnpm-workspace.yaml': 'packages: ["libs/*"]\n',
    'libs/a/package.json': '{ "name": "dup" }',
    'libs/b/package.json': '{ "name": "dup" }',
    'libs/c/package.json': '{ "name": "kept" }'
  });
  const model = buildWorkspaceModel(workspace.directory);
  const ids = model.projects.map((project) => project.id);
  const files = model.errors.map((error) => error.file);

  assert.deepEqual(ids, ['kept']);
  assert.deepEqual(files, [workspace.file('libs/b/package.json')]);
  assert.equal(model.projectByPackageName.get('dup'), undefined);
});

test('an id clash and a name clash on the same pair are one config error', (): void => {
  const workspace = tempWorkspace({
    'nx.json': '{}',
    'libs/x/project.json': '{ "name": "same" }',
    'libs/x/package.json': '{ "name": "pkg-x" }',
    'libs/y/project.json': '{ "name": "same" }',
    'libs/y/package.json': '{ "name": "pkg-x" }',
    'libs/z/project.json': '{ "name": "z" }'
  });
  const model = buildWorkspaceModel(workspace.directory);
  const files = model.errors.map((error) => error.file);

  assert.deepEqual(projectIds(workspace), ['z']);
  assert.deepEqual(files, [workspace.file('libs/y/package.json')]);
});

test('a malformed root package.json that is also a project is reported once', (): void => {
  const workspace = tempWorkspace({
    'nx.json': '{}',
    'project.json': '{ "name": "root" }',
    'package.json': '{ broken'
  });
  const model = buildWorkspaceModel(workspace.directory);
  const files = model.errors.map((error) => error.file);

  assert.deepEqual(files, [workspace.file('package.json')]);
});

test('projectForFile picks the longest root for nested projects and libs/a vs libs/a-b', (): void => {
  const workspace = tempWorkspace({
    'nx.json': '{}',
    'libs/a/project.json': '{ "name": "a" }',
    'libs/a/nested/project.json': '{ "name": "nested" }',
    'libs/a-b/project.json': '{ "name": "a-b" }'
  });
  const model = buildWorkspaceModel(workspace.directory);
  const idAt = (path: string): string | undefined => {
    const project = projectForFile(model, workspace.file(path));

    return project?.id;
  };

  assert.equal(idAt('libs/a/src/x.ts'), 'a');
  assert.equal(idAt('libs/a/nested/src/x.ts'), 'nested');
  assert.equal(idAt('libs/a-b/src/x.ts'), 'a-b');
  assert.equal(idAt('libs/a-b'), 'a-b');
  assert.equal(idAt('tools/x.ts'), undefined);
});

test('path alias targets resolve against baseUrl when set', (): void => {
  const workspace = fixture('nx');
  const model = buildWorkspaceModel(workspace.directory);
  const target = workspace.file('libs/util/src/index.ts');
  const expected: PathAlias[] = [{ pattern: '@acme/util', target }];

  assert.deepEqual(model.pathAliases, expected);
});

test('path alias targets resolve against the tsconfig dir without baseUrl', (): void => {
  const workspace = fixture('nx-tsconfig');
  const model = buildWorkspaceModel(workspace.directory);
  const target = workspace.file('libs/util/src/index.ts');
  const expected: PathAlias[] = [{ pattern: '@acme/util', target }];

  assert.deepEqual(model.pathAliases, expected);
});

test('root turbo.json and .moon/workspace.yml data land on the model', (): void => {
  const workspace = fixture('moon');
  const model = buildWorkspaceModel(workspace.directory);

  assert.ok(model.moonWorkspace);
  assert.equal(model.rootTurbo, undefined);
});

test('model is reused within the staleness window', (): void => {
  useFakeClock();

  const workspace = fixture('nx');
  const file = workspace.file('libs/util/src/u.ts');
  const first = workspaceModelFor(file);

  vi.advanceTimersByTime(5_000);

  assert.ok(first);
  assert.equal(workspaceModelFor(file), first);
});

test('after the window an edited manifest rebuilds the model', (): void => {
  useFakeClock();

  const workspace = fixture('nx');
  const file = workspace.file('libs/util/src/u.ts');
  const first = workspaceModelFor(file);

  rewrite(
    workspace.file('libs/util/project.json'),
    '{ "name": "util", "tags": ["scope:new"] }'
  );
  vi.advanceTimersByTime(PAST_WINDOW_MS);

  const second = workspaceModelFor(file);
  const util = second?.projects.find((project) => project.id === 'util');

  assert.notEqual(second, first);
  assert.deepEqual(util?.tags, ['scope:new']);
});

test('after the window an added package rebuilds the model', (): void => {
  useFakeClock();

  const workspace = fixture('pnpm-plain');
  const file = workspace.file('packages/feature/src/a.ts');
  const first = workspaceModelFor(file);

  rewrite(workspace.file('packages/added/package.json'), '{ "name": "added" }');
  vi.advanceTimersByTime(PAST_WINDOW_MS);

  const second = workspaceModelFor(file);

  assert.notEqual(second, first);
  assert.ok(second?.projectByPackageName.get('added'));
});

test('after the window with no change the same model is returned and lastValidatedAt advances', (): void => {
  useFakeClock();

  const workspace = fixture('nx');
  const file = workspace.file('libs/util/src/u.ts');
  const first = workspaceModelFor(file);

  assert.ok(first);

  const { lastValidatedAt, listing } = first;

  vi.advanceTimersByTime(PAST_WINDOW_MS);

  const second = workspaceModelFor(file);

  assert.ok(second);
  assert.equal(second, first);
  assert.equal(second.lastValidatedAt, lastValidatedAt + PAST_WINDOW_MS);
  assert.notEqual(second.listing, listing);
  assert.deepEqual(second.listing, listing);
});

test('the workspace root of a directory is reused within the window and re-found after it', (): void => {
  useFakeClock();

  const workspace = tempWorkspace({ 'nx.json': '{}', 'libs/a/src/x.ts': '' });
  const file = workspace.file('libs/a/src/x.ts');
  const first = workspaceModelFor(file);

  writeFileSync(workspace.file('libs/a/nx.json'), '{}');

  const within = workspaceModelFor(file);

  vi.advanceTimersByTime(PAST_WINDOW_MS);

  const after = workspaceModelFor(file);

  assert.equal(first?.root, workspace.directory);
  assert.equal(within?.root, workspace.directory);
  assert.equal(after?.root, workspace.file('libs/a'));
});

test('the workspaceRoot option wins and may be relative to the cwd', (): void => {
  const workspace = fixture('nx');
  const outside = tempWorkspace({ 'x.ts': '' });
  const option = relative(process.cwd(), workspace.directory);
  const model = workspaceModelFor(outside.file('x.ts'), option);

  assert.equal(model?.root, workspace.directory);
});

test('a workspaceRoot option that is not an existing directory gives no model', (): void => {
  const workspace = tempWorkspace({ 'nx.json': '{}', 'x.ts': '' });
  const file = workspace.file('x.ts');
  const missing = workspace.file('missing');

  assert.equal(workspaceModelFor(file, missing), undefined);
  assert.equal(workspaceModelFor(file, file), undefined);
});

test('a file outside any workspace has no model', (): void => {
  const outside = tempWorkspace({ 'x.ts': '' });

  assert.equal(workspaceModelFor(outside.file('x.ts')), undefined);
});
