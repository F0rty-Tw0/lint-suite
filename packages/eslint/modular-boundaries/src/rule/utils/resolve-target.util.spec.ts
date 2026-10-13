import assert from 'node:assert/strict';

import { onTestFinished, test } from 'vitest';

import {
  copyFixtureWorkspace,
  writeTempWorkspace
} from '../test/utils/fixture-workspace.spec.util.ts';
import { buildWorkspaceModel } from '../workspace-model.ts';
import { resolveTarget } from './resolve-target.util.ts';

import type {
  Project,
  Target,
  WorkspaceModel
} from '../common/modular-boundaries.type.ts';
import type { FixtureWorkspace } from '../test/common/fixture-workspace.type.ts';

type ModelCase = {
  readonly workspace: FixtureWorkspace;
  readonly model: WorkspaceModel;
  readonly source: string;
};

const SKIP: Target = { kind: 'skip' };

const modelCase = (workspace: FixtureWorkspace, source: string): ModelCase => {
  onTestFinished(workspace.dispose);

  const model = buildWorkspaceModel(workspace.directory);
  const sourceFile = workspace.file(source);
  const result: ModelCase = { workspace, model, source: sourceFile };

  return result;
};

const plainCase = (): ModelCase => {
  const workspace = copyFixtureWorkspace('pnpm-plain');

  return modelCase(workspace, 'packages/feature/src/a.ts');
};

const tempCase = (files: Record<string, string>): ModelCase => {
  const workspace = writeTempWorkspace(files);

  return modelCase(workspace, 'libs/app/src/main.ts');
};

const projectAt = (testCase: ModelCase, root: string): Project => {
  const directory = testCase.workspace.file(root);
  const project = testCase.model.projectByRoot.get(directory);

  assert.ok(project);

  return project;
};

const projectTarget = (
  project: Project,
  via: 'relative' | 'package' | 'alias'
): Target => {
  const target: Target = { kind: 'project', project, via };

  return target;
};

const resolveAll = (
  testCase: ModelCase,
  specifiers: string[],
  allow: string[] = []
): Target[] => {
  const { model, source } = testCase;
  const resolveOne = (specifier: string): Target => {
    return resolveTarget(specifier, source, model, allow);
  };

  return specifiers.map(resolveOne);
};

const WILDCARD_WORKSPACE: Record<string, string> = {
  'pnpm-workspace.yaml': 'packages: ["libs/*"]\n',
  'libs/a/package.json': '{ "name": "lib-a" }',
  'libs/b/package.json': '{ "name": "lib-b" }',
  'libs/app/package.json': '{ "name": "app" }',
  'tsconfig.base.json':
    '{ "compilerOptions": { "paths": { "@acme/*": ["libs/*/src/index.ts"], "@acme/special": ["libs/b/src"] } } }'
};

test('node: and builtins are skipped', (): void => {
  const testCase = plainCase();
  const specifiers = ['fs', 'fs/promises', 'node:fs', 'node:test', 'node:x'];
  const targets = resolveAll(testCase, specifiers);

  assert.deepEqual(targets, [SKIP, SKIP, SKIP, SKIP, SKIP]);
});

test('# subpath imports are skipped', (): void => {
  const testCase = plainCase();
  const targets = resolveAll(testCase, ['#internal', '#a/b']);

  assert.deepEqual(targets, [SKIP, SKIP]);
});

test('URL schemes are skipped', (): void => {
  const testCase = plainCase();
  const specifiers = ['https://esm.sh/x.js', 'virtual:entry', 'data:x'];
  const targets = resolveAll(testCase, specifiers);

  assert.deepEqual(targets, [SKIP, SKIP, SKIP]);
});

test('relative path into another project resolves to that project via relative', (): void => {
  const testCase = plainCase();
  const absolute = testCase.workspace.file('packages/data/src/index.ts');
  const specifiers = ['../../ui/src/index.ts', '../../ui/src/none', absolute];
  const targets = resolveAll(testCase, specifiers);
  const ui = projectAt(testCase, 'packages/ui');
  const data = projectAt(testCase, 'packages/data');
  const toUi = projectTarget(ui, 'relative');
  const toData = projectTarget(data, 'relative');

  assert.deepEqual(targets, [toUi, toUi, toData]);
});

test('relative path into no project is skipped', (): void => {
  const testCase = plainCase();
  const specifiers = ['../../../scripts/x.ts', '../../excluded/src/x.ts'];
  const targets = resolveAll(testCase, specifiers);

  assert.deepEqual(targets, [SKIP, SKIP]);
});

test('workspace package name wins over an npm package of the same name', (): void => {
  const testCase = tempCase({
    'pnpm-workspace.yaml': 'packages: ["libs/*"]\n',
    'libs/react/package.json': '{ "name": "react" }',
    'libs/app/package.json': '{ "name": "app" }'
  });
  const targets = resolveAll(testCase, ['react', 'react/jsx-runtime']);
  const react = projectAt(testCase, 'libs/react');
  const toReact = projectTarget(react, 'package');

  assert.deepEqual(targets, [toReact, toReact]);
});

test('package subpath resolves to the package project', (): void => {
  const testCase = plainCase();
  const specifiers = ['@ws/ui', '@ws/ui/src/index.ts', '@ws/uix'];
  const targets = resolveAll(testCase, specifiers);
  const ui = projectAt(testCase, 'packages/ui');
  const toUi = projectTarget(ui, 'package');
  const uix: Target = { kind: 'npm', name: '@ws/uix', specifier: '@ws/uix' };

  assert.deepEqual(targets, [toUi, toUi, uix]);
});

test('tsconfig paths alias resolves to the project containing its target', (): void => {
  const workspace = copyFixtureWorkspace('nx');
  const testCase = modelCase(workspace, 'libs/shell/src/s.ts');
  const targets = resolveAll(testCase, ['@acme/util']);
  const util = projectAt(testCase, 'libs/util');

  assert.deepEqual(targets, [projectTarget(util, 'alias')]);
});

test('root tsconfig.json alias resolves when there is no tsconfig.base.json', (): void => {
  const workspace = copyFixtureWorkspace('nx-tsconfig');
  const testCase = modelCase(workspace, 'libs/shell/src/s.ts');
  const targets = resolveAll(testCase, ['@acme/util']);
  const util = projectAt(testCase, 'libs/util');

  assert.deepEqual(targets, [projectTarget(util, 'alias')]);
});

test('wildcard alias substitutes the captured part into its target', (): void => {
  const testCase = tempCase(WILDCARD_WORKSPACE);
  const targets = resolveAll(testCase, ['@acme/a', '@acme/special']);
  const a = projectAt(testCase, 'libs/a');
  const b = projectAt(testCase, 'libs/b');
  const expected = [projectTarget(a, 'alias'), projectTarget(b, 'alias')];

  assert.deepEqual(targets, expected);
});

test('a matched alias whose target is in no project is skipped, an unmatched one falls through', (): void => {
  const testCase = tempCase(WILDCARD_WORKSPACE);
  const targets = resolveAll(testCase, ['@acme/missing', '@other/x']);
  const other: Target = {
    kind: 'npm',
    name: '@other/x',
    specifier: '@other/x'
  };

  assert.deepEqual(targets, [SKIP, other]);
});

test('scoped npm specifier yields the two-segment name', (): void => {
  const testCase = plainCase();
  const targets = resolveAll(testCase, ['@a/b/c', 'lodash/fp']);
  const scoped: Target = { kind: 'npm', name: '@a/b', specifier: '@a/b/c' };
  const plain: Target = { kind: 'npm', name: 'lodash', specifier: 'lodash/fp' };

  assert.deepEqual(targets, [scoped, plain]);
});

test('@/x and ~/x are skipped', (): void => {
  const testCase = plainCase();
  const targets = resolveAll(testCase, ['@/x', '~/x']);

  assert.deepEqual(targets, [SKIP, SKIP]);
});

test('allow pattern skips the specifier', (): void => {
  const testCase = plainCase();
  const specifiers = ['@ws/ui', '../../ui/src/index.ts', 'lodash'];
  const allow = ['@ws/*', '../../ui/**', '^lodash$'];
  const targets = resolveAll(testCase, specifiers, allow);

  assert.deepEqual(targets, [SKIP, SKIP, SKIP]);
});

test('undefined allow skips no specifier by allow', (): void => {
  const testCase = plainCase();
  const { model, source } = testCase;
  const target = resolveTarget('@ws/ui', source, model, undefined);
  const ui = projectAt(testCase, 'packages/ui');

  assert.deepEqual(target, projectTarget(ui, 'package'));
});
