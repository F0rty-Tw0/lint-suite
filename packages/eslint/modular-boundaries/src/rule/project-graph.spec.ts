import assert from 'node:assert/strict';
import { utimesSync, writeFileSync } from 'node:fs';

import { onTestFinished, test, vi } from 'vitest';

import {
  projectGraphFor,
  reachesSource,
  shortestProjectPath
} from './project-graph.ts';
import {
  copyFixtureWorkspace,
  writeTempWorkspace
} from './test/utils/fixture-workspace.spec.util.ts';
import { extractSpecifiers } from './utils/specifiers.util.ts';
import { buildWorkspaceModel, workspaceModelFor } from './workspace-model.ts';

import type {
  Project,
  RawGraph,
  WorkspaceModel
} from './common/modular-boundaries.type.ts';
import type { FixtureWorkspace } from './test/common/fixture-workspace.type.ts';

type Cycles = {
  readonly workspace: FixtureWorkspace;
  readonly model: WorkspaceModel;
  readonly project: (id: string) => Project;
};

vi.mock('./utils/specifiers.util.ts', { spy: true });

const PAST_WINDOW_MS = 10_001;

const cycles = (): Cycles => {
  const workspace = copyFixtureWorkspace('cycles');

  onTestFinished(workspace.dispose);

  const model = buildWorkspaceModel(workspace.directory);
  const project = (id: string): Project => {
    const found = model.projects.find((candidate) => candidate.id === id);

    assert.ok(found, `no project ${id}`);

    return found;
  };
  const result: Cycles = { workspace, model, project };

  return result;
};

const edgeIds = (graph: RawGraph): Record<string, string[]> => {
  const entries = [...graph.adjacency];
  const toIds = ([source, targets]: [Project, Set<Project>]): [
    string,
    string[]
  ] => {
    const ids = [...targets].map((target) => target.id);

    return [source.id, ids.toSorted()];
  };
  const pairs = entries.map(toIds);

  return Object.fromEntries(pairs);
};

const useFakeClock = (): void => {
  vi.useFakeTimers();
  onTestFinished(() => {
    vi.useRealTimers();
  });
};

const rewrite = (path: string, text: string): void => {
  const future = new Date(Date.now() + 60_000);

  writeFileSync(path, text);
  utimesSync(path, future, future);
};

test('cycles fixture: a reaches itself through b and c, and through d', (): void => {
  const { model, project } = cycles();
  const a = project('@c/a');
  const graph = projectGraphFor(model);
  const expected = {
    '@c/a': ['@c/b', '@c/d'],
    '@c/b': ['@c/c'],
    '@c/c': ['@c/a'],
    '@c/d': ['@c/a']
  };

  assert.deepEqual(edgeIds(graph), expected);
  assert.equal(reachesSource(model, [], project('@c/b'), a), true);
  assert.equal(reachesSource(model, [], project('@c/d'), a), true);
});

test('shortest path from b back to a is b -> c -> a', (): void => {
  const { model, project } = cycles();
  const path = shortestProjectPath(model, [], project('@c/b'), project('@c/a'));

  assert.deepEqual(path, ['@c/b', '@c/c', '@c/a']);
});

// p lists the long branch first, so a depth-first search would return p -> q -> r -> t.
test('shortest path takes the shorter of two branches', (): void => {
  const workspace = writeTempWorkspace({
    'pnpm-workspace.yaml': 'packages: ["packages/*"]\n',
    'packages/p/package.json': '{ "name": "@s/p" }',
    'packages/p/src/index.ts': "import '@s/q';\nimport '@s/s';\n",
    'packages/q/package.json': '{ "name": "@s/q" }',
    'packages/q/src/index.ts': "import '@s/r';\n",
    'packages/r/package.json': '{ "name": "@s/r" }',
    'packages/r/src/index.ts': "import '@s/t';\n",
    'packages/s/package.json': '{ "name": "@s/s" }',
    'packages/s/src/index.ts': "import '@s/t';\n",
    'packages/t/package.json': '{ "name": "@s/t" }'
  });

  onTestFinished(workspace.dispose);

  const model = buildWorkspaceModel(workspace.directory);
  const byId = (id: string): Project => {
    const found = model.projects.find((candidate) => candidate.id === id);

    assert.ok(found, `no project ${id}`);

    return found;
  };
  const path = shortestProjectPath(model, [], byId('@s/p'), byId('@s/t'));

  assert.deepEqual(path, ['@s/p', '@s/s', '@s/t']);
});

test('an ignored pair breaks the cycle in both directions', (): void => {
  const { model, project } = cycles();
  const a = project('@c/a');
  const d = project('@c/d');
  const ignored: [string, string][] = [['@c/d', '@c/*a']];

  assert.equal(reachesSource(model, ignored, d, a), false);
  assert.equal(reachesSource(model, ignored, a, d), false);
  assert.equal(reachesSource(model, ignored, project('@c/b'), a), true);
  assert.deepEqual(shortestProjectPath(model, ignored, d, a), []);
  assert.equal(reachesSource(model, [], d, a), true);
});

test('graph is cached per model', (): void => {
  const { model } = cycles();
  const first = projectGraphFor(model);
  const calls = vi.mocked(extractSpecifiers).mock.calls.length;
  const second = projectGraphFor(model);

  assert.ok(calls > 0);
  assert.equal(second, first);
  assert.equal(vi.mocked(extractSpecifiers).mock.calls.length, calls);
});

test('after the window a changed source file rebuilds only the graph', (): void => {
  useFakeClock();

  const { workspace } = cycles();
  const file = workspace.file('packages/b/src/index.ts');
  const model = workspaceModelFor(file);

  assert.ok(model);

  const graph = projectGraphFor(model);

  rewrite(file, 'export const b = [];\n');
  vi.advanceTimersByTime(PAST_WINDOW_MS);

  const nextModel = workspaceModelFor(file);

  assert.equal(nextModel, model);

  const nextGraph = projectGraphFor(model);

  assert.notEqual(nextGraph, graph);
  assert.deepEqual(edgeIds(nextGraph)['@c/b'], []);
  assert.equal(nextGraph.validatedAt, model.lastValidatedAt);
});

test('after the window with no change the same RawGraph is returned and validatedAt advances', (): void => {
  useFakeClock();

  const { workspace } = cycles();
  const file = workspace.file('packages/b/src/index.ts');
  const model = workspaceModelFor(file);

  assert.ok(model);

  const graph = projectGraphFor(model);
  const { validatedAt } = graph;

  vi.advanceTimersByTime(PAST_WINDOW_MS);
  workspaceModelFor(file);

  assert.equal(projectGraphFor(model), graph);
  assert.equal(graph.validatedAt, validatedAt + PAST_WINDOW_MS);
});

test('a source file outside every project contributes no edges', (): void => {
  const workspace = writeTempWorkspace({
    'pnpm-workspace.yaml': 'packages: ["packages/*"]\n',
    'packages/a/package.json': '{ "name": "@o/a" }',
    'packages/a/src/self.ts': "import { a } from '@o/a';\n",
    'packages/b/package.json': '{ "name": "@o/b" }',
    'scripts/outside.ts': "import { b } from '@o/b';\n"
  });

  onTestFinished(workspace.dispose);

  const model = buildWorkspaceModel(workspace.directory);
  const graph = projectGraphFor(model);
  const texts = vi.mocked(extractSpecifiers).mock.calls.flat();
  const expected = { '@o/a': [], '@o/b': [] };

  assert.deepEqual(edgeIds(graph), expected);
  assert.ok(texts.some((text) => text.includes('@o/a')));
  assert.ok(!texts.some((text) => text.includes('@o/b')));
});
