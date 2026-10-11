import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { onTestFinished, test } from 'vitest';

import { writeTempWorkspace } from '../test/utils/fixture-workspace.spec.util.ts';
import { listWorkspaceFiles } from './workspace-listing.util.ts';

import type { WorkspaceListing } from '../common/modular-boundaries.type.ts';

type ListedWorkspace = {
  readonly file: (path: string) => string;
  readonly listing: WorkspaceListing;
};

const PNPM_MARKER = 'packages:\n  - packages/*\n';
const isRoot = process.getuid?.() === 0;

const runGit = (directory: string, args: string[]): void => {
  const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
};

const listed = (
  files: Record<string, string>,
  prepare: (directory: string) => void = (): void => undefined
): ListedWorkspace => {
  const workspace = writeTempWorkspace(files);

  onTestFinished(workspace.dispose);
  prepare(workspace.directory);

  const listing = listWorkspaceFiles(workspace.directory, new Map());
  const result: ListedWorkspace = { file: workspace.file, listing };

  return result;
};

const initGit = (directory: string): void => {
  runGit(directory, ['init', '-q']);
  runGit(directory, ['add', '-A']);
};

test('a moon workspace marker makes the parent of .moon a nested root', (): void => {
  const { file, listing } = listed({
    'pnpm-workspace.yaml': PNPM_MARKER,
    'nested/.moon/workspace.yml': 'projects: []\n',
    'nested/x/package.json': '{ "name": "x" }',
    'packages/a/package.json': '{ "name": "a" }'
  });

  assert.deepEqual(listing.manifests, [file('packages/a/package.json')]);
});

test('a nested package.json with workspaces hides its subtree', (): void => {
  const { file, listing } = listed({
    'pnpm-workspace.yaml': PNPM_MARKER,
    'nested/package.json': '{ "workspaces": ["libs/*"] }',
    'nested/libs/b/package.json': '{ "name": "b" }',
    'packages/a/package.json': '{ "name": "a" }'
  });

  assert.deepEqual(listing.manifests, [file('packages/a/package.json')]);
});

test('a nested package turbo.json that extends the root is not a nested root', (): void => {
  const { file, listing } = listed({
    'pnpm-workspace.yaml': PNPM_MARKER,
    'turbo.json': '{ "tasks": {} }',
    'packages/a/package.json': '{ "name": "a" }',
    'packages/a/turbo.json': '{ "extends": ["//"] }'
  });

  assert.deepEqual(listing.manifests, [file('packages/a/package.json')]);
  assert.deepEqual(listing.packageTurboFiles, [file('packages/a/turbo.json')]);
});

test('.nxignore line without a trailing slash also hides everything below it', (): void => {
  const { file, listing } = listed({
    'pnpm-workspace.yaml': PNPM_MARKER,
    '.nxignore': '# legacy\n/apps/legacy\n',
    'apps/legacy/package.json': '{ "name": "legacy" }',
    'apps/legacy/src/index.ts': '',
    'apps/live/package.json': '{ "name": "live" }'
  });

  assert.deepEqual(listing.manifests, [file('apps/live/package.json')]);
  assert.deepEqual(listing.sourceFiles, []);
});

test('listing uses git when available and honours .gitignore', (): void => {
  const { file, listing } = listed(
    {
      'pnpm-workspace.yaml': PNPM_MARKER,
      '.gitignore': 'ignored/\n',
      'ignored/package.json': '{ "name": "ignored" }',
      'packages/a/package.json': '{ "name": "a" }'
    },
    (directory): void => {
      initGit(directory);
      writeFileSync(resolve(directory, 'project.json'), '{}');
    }
  );

  const manifests = listing.manifests.toSorted();
  const expected = [file('packages/a/package.json'), file('project.json')];

  assert.deepEqual(manifests, expected);
});

test('listing falls back to a walk when git lists nothing for a gitignored workspace', (): void => {
  const workspace = writeTempWorkspace({
    '.gitignore': 'ws/\n',
    'ws/pnpm-workspace.yaml': PNPM_MARKER,
    'ws/packages/a/package.json': '{ "name": "a" }'
  });

  onTestFinished(workspace.dispose);
  initGit(workspace.directory);

  const listing = listWorkspaceFiles(workspace.file('ws'), new Map());
  const expected = [workspace.file('ws/packages/a/package.json')];

  assert.deepEqual(listing.manifests, expected);
});

test('listing falls back to a walk outside git and skips node_modules', (): void => {
  const { file, listing } = listed({
    'pnpm-workspace.yaml': PNPM_MARKER,
    'node_modules/dep/package.json': '{ "name": "dep" }',
    'node_modules/dep/index.js': '',
    'packages/a/package.json': '{ "name": "a" }'
  });

  assert.deepEqual(listing.manifests, [file('packages/a/package.json')]);
  assert.deepEqual(listing.sourceFiles, []);
});

test.skipIf(isRoot)('the walk skips a directory it cannot read', (): void => {
  const { file, listing } = listed(
    {
      'pnpm-workspace.yaml': PNPM_MARKER,
      'locked/package.json': '{ "name": "locked" }',
      'packages/a/package.json': '{ "name": "a" }'
    },
    (directory): void => {
      const locked = resolve(directory, 'locked');
      const unlock = (): void => {
        chmodSync(locked, 0o755);
      };

      chmodSync(locked, 0o000);
      onTestFinished(unlock);
    }
  );

  assert.deepEqual(listing.manifests, [file('packages/a/package.json')]);
});

test('listing splits manifests, package turbo files and source files', (): void => {
  const { file, listing } = listed({
    'pnpm-workspace.yaml': PNPM_MARKER,
    'turbo.json': '{ "tasks": {} }',
    'project.json': '{}',
    'packages/a/moon.yml': 'tags: []\n',
    'packages/a/turbo.json': '{ "extends": ["//"] }',
    'packages/a/src/index.tsx': '',
    'packages/a/src/cli.mjs': '',
    'packages/a/README.md': ''
  });

  const manifests = listing.manifests.toSorted();
  const sourceFiles = listing.sourceFiles.toSorted();
  const expectedManifests = [file('packages/a/moon.yml'), file('project.json')];
  const expectedSources = [
    file('packages/a/src/cli.mjs'),
    file('packages/a/src/index.tsx')
  ];

  assert.deepEqual(manifests, expectedManifests);
  assert.deepEqual(listing.packageTurboFiles, [file('packages/a/turbo.json')]);
  assert.deepEqual(sourceFiles, expectedSources);
});

test('stored paths equal path.resolve output', (): void => {
  const { file, listing } = listed(
    {
      'pnpm-workspace.yaml': PNPM_MARKER,
      'packages/a/package.json': '{ "name": "a" }',
      'packages/a/turbo.json': '{ "extends": ["//"] }',
      'packages/a/src/index.ts': ''
    },
    initGit
  );

  const root = file('.');
  const stored = [
    ...listing.manifests,
    ...listing.packageTurboFiles,
    ...listing.sourceFiles
  ];
  const expected = [
    resolve(root, 'packages/a/package.json'),
    resolve(root, 'packages/a/turbo.json'),
    resolve(root, 'packages/a/src/index.ts')
  ];

  assert.deepEqual(stored, expected);
});
