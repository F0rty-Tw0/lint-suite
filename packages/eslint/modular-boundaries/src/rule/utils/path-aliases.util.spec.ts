import assert from 'node:assert/strict';

import { onTestFinished, test } from 'vitest';

import { readPathAliases } from './path-aliases.util.ts';
import type {
  ConfigError,
  PathAlias
} from '../common/modular-boundaries.type.ts';
import type { FixtureWorkspace } from '../test/common/fixture-workspace.type.ts';
import { writeTempWorkspace } from '../test/utils/fixture-workspace.spec.util.ts';

const tempWorkspace = (files: Record<string, string>): FixtureWorkspace => {
  const workspace = writeTempWorkspace(files);

  onTestFinished(workspace.dispose);

  return workspace;
};

test('wildcard aliases keep * and take the first target', (): void => {
  const workspace = tempWorkspace({
    'tsconfig.base.json':
      '{ "compilerOptions": { "paths": { "@acme/*": ["libs/*/src", "x/*"] } } }'
  });
  const aliases = readPathAliases(workspace.directory, new Map(), []);
  const target = workspace.file('libs/*/src');
  const expected: PathAlias[] = [{ pattern: '@acme/*', target }];

  assert.deepEqual(aliases, expected);
});

test('tsconfig.base.json wins over tsconfig.json and is recorded as read', (): void => {
  const workspace = tempWorkspace({
    'tsconfig.base.json': '{ "compilerOptions": { "paths": { "a": ["a"] } } }',
    'tsconfig.json': '{ "compilerOptions": { "paths": { "b": ["b"] } } }'
  });
  const readSet = new Map<string, unknown>();
  const aliases = readPathAliases(workspace.directory, readSet, []);
  const patterns = aliases.map((alias) => alias.pattern);

  assert.deepEqual(patterns, ['a']);
  assert.ok(readSet.has(workspace.file('tsconfig.base.json')));
});

test('a malformed root tsconfig is a config error and gives no aliases', (): void => {
  const workspace = tempWorkspace({ 'tsconfig.json': '{ "compilerOptions": ' });
  const errors: ConfigError[] = [];
  const aliases = readPathAliases(workspace.directory, new Map(), errors);
  const files = errors.map((error) => error.file);

  assert.deepEqual(aliases, []);
  assert.deepEqual(files, [workspace.file('tsconfig.json')]);
});

test('entries without a string target are skipped', (): void => {
  const workspace = tempWorkspace({
    'tsconfig.json': '{ "compilerOptions": { "paths": { "a": [], "b": "x" } } }'
  });

  assert.deepEqual(readPathAliases(workspace.directory, new Map(), []), []);
});
