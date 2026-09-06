import assert from 'node:assert/strict';

import { isImportDeclaration } from 'typescript';
import type { Expression } from 'typescript';
import { test } from 'vitest';

import { fixtureProgram, fixtureSourceFile } from './fixture-program.spec.util.ts';
import { moduleTarget } from './module-target.util.ts';

const FIXTURE = 'edge-cases';

const program = fixtureProgram(FIXTURE);
const checker = program.getTypeChecker();

const isNeverExternal = (): boolean => false;

const alwaysExternal = (): boolean => true;

const importSpecifierOf = (file: string): Expression => {
  const sourceFile = fixtureSourceFile(program, FIXTURE, file);
  const [statement] = sourceFile.statements;

  assert.ok(statement && isImportDeclaration(statement));

  return statement.moduleSpecifier;
};

test('resolves an internal import specifier to its source file name', () => {
  const specifier = importSpecifierOf('local-export.ts');
  const target = fixtureSourceFile(program, FIXTURE, 'target.ts');

  const resolved = moduleTarget(specifier, checker, isNeverExternal);

  assert.equal(resolved, target.fileName);
});

test('returns undefined for a missing specifier', () => {
  const resolved = moduleTarget(undefined, checker, isNeverExternal);

  assert.equal(resolved, undefined);
});

test('returns undefined when the resolved file is external', () => {
  const specifier = importSpecifierOf('local-export.ts');

  const resolved = moduleTarget(specifier, checker, alwaysExternal);

  assert.equal(resolved, undefined);
});
