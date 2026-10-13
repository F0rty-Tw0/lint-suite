import assert from 'node:assert/strict';
import { join } from 'node:path';

import { onTestFinished, test } from 'vitest';

import { writeTempWorkspace } from '../test/utils/fixture-workspace.spec.util.ts';
import { findWorkspaceRoot, isWorkspaceRoot } from './workspace-root.util.ts';

const isRootWith = (files: Record<string, string>): boolean => {
  const workspace = writeTempWorkspace(files);

  onTestFinished(workspace.dispose);

  return isWorkspaceRoot(workspace.directory, new Map());
};

test('pnpm-workspace.yaml marks a workspace root', (): void => {
  const isRoot = isRootWith({ 'pnpm-workspace.yaml': 'packages: []\n' });

  assert.equal(isRoot, true);
});

test('package.json with a workspaces array marks a workspace root', (): void => {
  const isRoot = isRootWith({ 'package.json': '{ "workspaces": ["libs/*"] }' });

  assert.equal(isRoot, true);
});

test('package.json with the workspaces object form marks a workspace root', (): void => {
  const isRoot = isRootWith({
    'package.json': '{ "workspaces": { "packages": ["libs/*"] } }'
  });

  assert.equal(isRoot, true);
});

test('package.json with a UTF-8 BOM and workspaces marks a workspace root', (): void => {
  const isRoot = isRootWith({ 'package.json': '\uFEFF{ "workspaces": [] }' });

  assert.equal(isRoot, true);
});

test('package.json without workspaces is not a workspace root', (): void => {
  const isRoot = isRootWith({ 'package.json': '{ "name": "a" }' });

  assert.equal(isRoot, false);
});

test('nx.json marks a workspace root', (): void => {
  const isRoot = isRootWith({ 'nx.json': '{}' });

  assert.equal(isRoot, true);
});

test('turbo.json without extends marks a workspace root', (): void => {
  const isRoot = isRootWith({ 'turbo.json': '{ "tasks": {} }' });

  assert.equal(isRoot, true);
});

test('turbo.json with extends is not a workspace root', (): void => {
  const isRoot = isRootWith({ 'turbo.json': '{ "extends": ["//"] }' });

  assert.equal(isRoot, false);
});

test('.moon/workspace.yml marks a workspace root', (): void => {
  const isRoot = isRootWith({ '.moon/workspace.yml': 'projects: []\n' });

  assert.equal(isRoot, true);
});

test('isWorkspaceRoot records every marker it reads', (): void => {
  const workspace = writeTempWorkspace({ 'nx.json': '{}' });
  const readSet = new Map<string, unknown>();

  onTestFinished(workspace.dispose);
  isWorkspaceRoot(workspace.directory, readSet);

  const pnpmMarker = workspace.file('pnpm-workspace.yaml');
  const nxMarker = workspace.file('nx.json');

  assert.equal(readSet.get(pnpmMarker), null);
  assert.deepEqual(readSet.get(nxMarker), { ok: true, data: {} });
});

test('findWorkspaceRoot ignores a package turbo.json that extends the root', (): void => {
  const workspace = writeTempWorkspace({
    'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
    'packages/a/turbo.json': '{ "extends": ["//"] }'
  });

  onTestFinished(workspace.dispose);

  const start = workspace.file('packages/a');
  const root = findWorkspaceRoot(start, new Map());

  assert.equal(root, workspace.directory);
});

test('findWorkspaceRoot stops at the nearest root', (): void => {
  const workspace = writeTempWorkspace({
    'pnpm-workspace.yaml': 'packages: []\n',
    'nested/nx.json': '{}',
    'nested/libs/a/package.json': '{ "name": "a" }'
  });

  onTestFinished(workspace.dispose);

  const start = workspace.file('nested/libs/a');
  const root = findWorkspaceRoot(start, new Map());

  assert.equal(root, join(workspace.directory, 'nested'));
});
