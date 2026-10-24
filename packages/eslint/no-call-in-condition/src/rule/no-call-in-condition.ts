import { toRegExp } from '@lint-suite/rule-internals/utils/to-regexp.util.ts';
import { ESLintUtils } from '@typescript-eslint/utils';
import type {
  ParserServicesWithTypeInformation,
  TSESLint
} from '@typescript-eslint/utils';

import {
  PREDICATE_PATTERNS,
  defaultOptions,
  meta
} from './common/no-call-in-condition.const.ts';
import type {
  CallExemptions,
  MessageIds,
  Options,
  PendingFeed,
  RuleContext
} from './common/no-call-in-condition.type.ts';
import {
  conditionParts,
  constFeed,
  isFedConst
} from './utils/condition-calls.util.ts';
import { callReporter } from './utils/hoist-report.util.ts';

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint/no-call-in-condition#readme'
);

const typedServices = (
  context: RuleContext
): ParserServicesWithTypeInformation | undefined => {
  const { parserServices } = context.sourceCode;

  if (!parserServices?.program) return undefined;

  return ESLintUtils.getParserServices(context);
};

export default createRule<Options, MessageIds>({
  name: 'no-call-in-condition',
  meta,
  defaultOptions,
  create(context, [{ allowPredicates = PREDICATE_PATTERNS }]) {
    const { sourceCode } = context;
    const services = typedServices(context);
    const allowed = allowPredicates.map(toRegExp);
    let hasFedConst = false;
    const pending: PendingFeed[] = [];
    const reportCalls = callReporter(context);

    const listeners: TSESLint.RuleListener = {
      IfStatement(node): void {
        const { calls, identifiers } = conditionParts(node.test);
        const scopeOf = (): TSESLint.Scope.Scope => sourceCode.getScope(node);
        const exemptions: CallExemptions = { allowed, scopeOf, services };

        reportCalls(calls, node, exemptions);

        for (const identifier of identifiers) {
          const entry: PendingFeed = { identifier, exemptions };

          pending.push(entry);
        }
      },
      VariableDeclaration(node): void {
        hasFedConst ||= isFedConst(node);
      },
      'Program:exit'(): void {
        if (!hasFedConst) return;

        for (const { identifier, exemptions } of pending) {
          const scope = exemptions.scopeOf();
          const feed = constFeed(identifier, scope);

          if (feed) {
            const fed = conditionParts(feed.init);

            reportCalls(fed.calls, feed.statement, exemptions);
          }
        }
      }
    };

    return listeners;
  }
});
