import assert from 'node:assert/strict';

import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';
import { RuleTester } from 'eslint';
import type { ESLint, Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { isInsideDecoratorConfig } from './decorator-config.util.ts';

type Options = [];
type MessageIds = 'exempt' | 'notExempt';

const messages: Record<MessageIds, string> = {
  exempt: 'Object expression is exempt as decorator config.',
  notExempt: 'Object expression is not exempt as decorator config.'
};

const docs: TSESLint.RuleMetaDataDocs = {
  description: 'Test-only probe rule for isInsideDecoratorConfig'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'problem',
  docs,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#decorator-config-probe'
);

const probeRule = createRule<Options, MessageIds>({
  name: 'decorator-config-probe',
  meta,
  defaultOptions: [],
  create(context) {
    const listeners: TSESLint.RuleListener = {
      ObjectExpression(node): void {
        const ancestors = context.sourceCode.getAncestors(node);
        const isExempt = isInsideDecoratorConfig(node, ancestors);
        const messageId: MessageIds = isExempt ? 'exempt' : 'notExempt';
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId
        };

        context.report(report);
      }
    };

    return listeners;
  }
});

const probePlugin: ESLint.Plugin = { meta: { name: 'probe' } };

Object.assign(probePlugin, {
  rules: { 'decorator-config-probe': probeRule }
});
const probePlugins = { probe: probePlugin };
const probeConfig = defineConfig([{ plugins: probePlugins }]);
const rule = probeConfig
  .map((config) => config.plugins?.['probe'])
  .find(Boolean)?.rules?.['decorator-config-probe'];

assert.ok(rule, 'probe plugin must register decorator-config-probe');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const exemptError: RuleTester.TestCaseError = { messageId: 'exempt' };
const notExemptError: RuleTester.TestCaseError = { messageId: 'notExempt' };

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'skips code with no object expressions',
    code: `const x = 1;`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'exempts the direct decorator call argument',
    code: `@Component({ selector: 'x' }) class C {}`,
    errors: [exemptError]
  },
  {
    name: 'exempts an object nested inside the decorator argument',
    code: `@NgModule({ providers: [{ provide: A, useClass: B }] }) class C {}`,
    errors: [exemptError, exemptError]
  },
  {
    name: 'reports a plain object expression outside any decorator',
    code: `const o = { a: 1 };`,
    errors: [notExemptError]
  },
  {
    name: 'reports an object expression passed to a non-decorator call',
    code: `foo({ a: 1 });`,
    errors: [notExemptError]
  }
];

ruleTester.run('decorator-config-probe', rule, { valid, invalid });
