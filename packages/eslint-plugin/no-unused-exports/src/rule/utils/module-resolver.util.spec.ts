import assert from 'node:assert/strict';

import { isImportDeclaration } from 'typescript';
import type { Expression, SourceFile } from 'typescript';
import { test } from 'vitest';

import { moduleResolver } from './module-resolver.util.ts';
import type { ModuleResolution } from '../common/no-unused-exports.type.ts';
import {
  fixtureProgram,
  fixtureSourceFile
} from '../test/utils/fixture-program.spec.util.ts';

const FIXTURE = 'edge-cases';

const program = fixtureProgram(FIXTURE);
const checker = program.getTypeChecker();
const target = fixtureSourceFile(program, FIXTURE, 'target.ts');

const isNeverExternal = (): boolean => false;

const alwaysExternal = (): boolean => true;

const never = (): undefined => undefined;

const onTarget = (): SourceFile => target;

const resolution = (
  overrides: Partial<ModuleResolution> = {}
): ModuleResolution => {
  const base: ModuleResolution = {
    checker,
    isExternal: isNeverExternal,
    onDisk: never
  };

  const merged: ModuleResolution = { ...base, ...overrides };

  return merged;
};

const importSpecifierOf = (file: string): Expression => {
  const sourceFile = fixtureSourceFile(program, FIXTURE, file);
  const [statement] = sourceFile.statements;

  assert.ok(statement && isImportDeclaration(statement));

  return statement.moduleSpecifier;
};

test('resolves an internal import specifier to its source file name', () => {
  const dangling: string[] = [];
  const resolve = moduleResolver(resolution(), dangling);

  const resolved = resolve(importSpecifierOf('local-export.ts'));

  assert.equal(resolved, target.fileName);
  assert.deepEqual(dangling, []);
});

test('returns undefined for a missing specifier', () => {
  const resolve = moduleResolver(resolution(), []);

  assert.equal(resolve(undefined), undefined);
});

test('returns undefined when the resolved file is external', () => {
  const external = resolution({ isExternal: alwaysExternal });
  const resolve = moduleResolver(external, []);

  assert.equal(resolve(importSpecifierOf('local-export.ts')), undefined);
});

test('lists a specifier found nowhere as dangling', () => {
  const dangling: string[] = [];
  const resolve = moduleResolver(resolution(), dangling);

  const resolved = resolve(importSpecifierOf('dangling-import.ts'));

  assert.equal(resolved, undefined);
  assert.deepEqual(dangling, ['./gone']);
});

test('falls back to the disk when the checker knows nothing', () => {
  const dangling: string[] = [];
  const onDisk = resolution({ onDisk: onTarget });
  const resolve = moduleResolver(onDisk, dangling);

  const resolved = resolve(importSpecifierOf('dangling-import.ts'));

  assert.equal(resolved, target.fileName);
  assert.deepEqual(dangling, []);
});

test('never asks the disk about a specifier the checker resolved', () => {
  let asked = 0;
  const counting = (): undefined => {
    asked += 1;

    return undefined;
  };
  const resolve = moduleResolver(resolution({ onDisk: counting }), []);

  resolve(importSpecifierOf('local-export.ts'));

  assert.equal(asked, 0);
});
