import assert from 'node:assert/strict';

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { describe, test } from 'vitest';

import { ambientAliases } from './ambient-alias.util.ts';
import { inspectGlobalScope } from '../test/utils/linted-scope.spec.util.ts';

const NAMES: ReadonlySet<string> = new Set(['process', 'fetch']);

const nameOf = (identifier: TSESTree.Identifier): string => identifier.name;

const namesInScope = (scope: TSESLint.Scope.Scope): string[] => {
  const aliases = ambientAliases(scope, NAMES);
  const names = aliases.map(nameOf);

  return names;
};

const aliasNames = (code: string): string[] => {
  const names = inspectGlobalScope(code, namesInScope);

  return names;
};

describe('FEATURE: ambientAliases', () => {
  describe('GIVEN an ambient global used as a bare value', () => {
    test('WHEN it is assigned THEN returns it', () => {
      const names = aliasNames(`const p = process;`);

      assert.deepEqual(names, ['process']);
    });

    test('WHEN it is destructured THEN returns it', () => {
      const names = aliasNames(`const { env } = process;`);

      assert.deepEqual(names, ['process']);
    });

    test('WHEN it is passed as a callback THEN returns it', () => {
      const names = aliasNames(`urls.map(fetch);`);

      assert.deepEqual(names, ['fetch']);
    });

    test('WHEN it is a computed member key THEN returns it', () => {
      const names = aliasNames(`const value = table[process];`);

      assert.deepEqual(names, ['process']);
    });
  });

  describe('GIVEN an ambient global the rule reports elsewhere', () => {
    test('WHEN it is a member object THEN skips it', () => {
      const names = aliasNames(`const env = process.env;`);

      assert.deepEqual(names, []);
    });

    test('WHEN it is called directly THEN skips it', () => {
      const names = aliasNames(`fetch(url);`);

      assert.deepEqual(names, []);
    });
  });

  describe('GIVEN a reference that is not an ambient value', () => {
    test('WHEN the name is outside the list THEN skips it', () => {
      const names = aliasNames(`const w = window;`);

      assert.deepEqual(names, []);
    });

    test('WHEN a local binding shadows it THEN skips it', () => {
      const names = aliasNames(`const fetch = 1;\nconst f = fetch;`);

      assert.deepEqual(names, []);
    });

    test('WHEN it sits in a type query THEN skips it', () => {
      const names = aliasNames(`type Env = typeof process;`);

      assert.deepEqual(names, []);
    });

    test('WHEN it sits in a qualified type query THEN skips it', () => {
      const names = aliasNames(`type Env = typeof process.env;`);

      assert.deepEqual(names, []);
    });
  });
});
