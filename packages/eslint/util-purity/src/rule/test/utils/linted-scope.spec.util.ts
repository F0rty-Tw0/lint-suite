import assert from 'node:assert/strict';

import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';
import { Linter } from 'eslint';
import type { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

type ScopeInspector<T> = (scope: TSESLint.Scope.Scope) => T;

const createProbe = ESLintUtils.RuleCreator.withoutDocs;

const probeMeta: TSESLint.RuleMetaData<never, unknown, []> = {
  type: 'problem',
  schema: [],
  messages: {}
};

const languageOptions: Linter.LanguageOptions = {
  parser: tseslint.parser,
  sourceType: 'module'
};

const probeRules: Linter.RulesRecord = { 'probe/scope': 'error' };

export const inspectGlobalScope = <T>(
  code: string,
  inspect: ScopeInspector<T>
): T => {
  const results: T[] = [];
  const probeRule = createProbe({
    meta: probeMeta,
    defaultOptions: [],
    create(context) {
      const listeners: TSESLint.RuleListener = {
        Program(node): void {
          const scope = context.sourceCode.getScope(node);
          const result = inspect(scope);

          results.push(result);
        }
      };

      return listeners;
    }
  });
  const rules = { scope: probeRule };
  const probe: ESLint.Plugin = {};

  Object.assign(probe, { rules });

  const plugins = { probe };
  const config: Linter.Config = {
    files: ['**/*.ts'],
    languageOptions,
    plugins,
    rules: probeRules
  };
  const linter = new Linter();

  linter.verify(code, config, 'probe.ts');

  const result = results.at(0);

  assert.ok(result !== undefined, 'probe rule must run once');

  return result;
};
