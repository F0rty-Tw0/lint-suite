import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
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
  RuleContext
} from './common/no-call-in-condition.type.ts';
import { isExemptCall } from './utils/call-exemptions.util.ts';
import {
  calleeName,
  conditionParts,
  constFeed
} from './utils/condition-calls.util.ts';
import { toRegExp } from '@lint-suite/rule-internals/utils/to-regexp.util.ts';

type HoistTarget = TSESTree.IfStatement | TSESTree.VariableDeclaration;
type Suggestions = TSESLint.SuggestionReportDescriptor<MessageIds>[];

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint-plugin/no-call-in-condition#readme'
);

const HOISTABLE_PARENTS = new Set([
  TSESTree.AST_NODE_TYPES.BlockStatement,
  TSESTree.AST_NODE_TYPES.Program,
  TSESTree.AST_NODE_TYPES.StaticBlock,
  TSESTree.AST_NODE_TYPES.SwitchCase,
  TSESTree.AST_NODE_TYPES.TSModuleBlock
]);

const INDENT_PATTERN = /^[\t ]*/u;

const typedServices = (
  context: RuleContext
): ParserServicesWithTypeInformation | undefined => {
  const { parserServices } = context.sourceCode;

  if (!parserServices?.program) return undefined;

  return ESLintUtils.getParserServices(context);
};

const statementIndent = (
  statement: HoistTarget,
  sourceCode: TSESLint.SourceCode
): string => {
  const line = sourceCode.lines[statement.loc.start.line - 1] ?? '';
  const indent = INDENT_PATTERN.exec(line)?.[0];

  return indent ?? '';
};

const suggestionsOf = (
  call: TSESTree.CallExpression,
  statement: HoistTarget,
  sourceCode: TSESLint.SourceCode
): Suggestions => {
  const empty: Suggestions = [];
  const isHoistable = HOISTABLE_PARENTS.has(statement.parent.type);

  if (!isHoistable) return empty;

  const name = calleeName(call.callee);

  if (name === undefined) return empty;

  const constName = `${name}Result`;
  const callText = sourceCode.getText(call);
  const indent = statementIndent(statement, sourceCode);
  const declaration = `const ${constName} = ${callText};\n${indent}`;
  const fix: TSESLint.ReportFixFunction = (fixer) => {
    const hoisted = fixer.insertTextBefore(statement, declaration);
    const replaced = fixer.replaceText(call, constName);
    const fixes = [hoisted, replaced];

    return fixes;
  };
  const data = { name: constName };
  const suggestion: TSESLint.SuggestionReportDescriptor<MessageIds> = {
    messageId: 'hoistCall',
    data,
    fix
  };
  const suggestions: Suggestions = [suggestion];

  return suggestions;
};

const reportOf = (
  call: TSESTree.CallExpression,
  statement: HoistTarget,
  sourceCode: TSESLint.SourceCode
): TSESLint.ReportDescriptor<MessageIds> => {
  const suggest = suggestionsOf(call, statement, sourceCode);
  const callee = sourceCode.getText(call.callee);
  const data = { callee };
  const report: TSESLint.ReportDescriptor<MessageIds> = {
    node: call,
    messageId: 'callInCondition',
    data,
    suggest
  };

  return report;
};

export default createRule<Options, MessageIds>({
  name: 'no-call-in-condition',
  meta,
  defaultOptions,
  create(context, [{ allowPredicates = PREDICATE_PATTERNS }]) {
    const { sourceCode } = context;
    const services = typedServices(context);
    const allowed = allowPredicates.map(toRegExp);
    const reported = new Set<TSESTree.CallExpression>();

    const reportCalls = (
      calls: TSESTree.CallExpression[],
      statement: HoistTarget,
      exemptions: CallExemptions
    ): void => {
      for (const call of calls) {
        const isReported = reported.has(call);

        if (isReported) continue;

        const isExempt = isExemptCall(call, exemptions);

        if (isExempt) continue;

        reported.add(call);

        const report = reportOf(call, statement, sourceCode);

        context.report(report);
      }
    };

    const listeners: TSESLint.RuleListener = {
      IfStatement(node): void {
        const { calls, identifiers } = conditionParts(node.test);
        const isEmpty = calls.length === 0 && identifiers.length === 0;

        if (isEmpty) return;

        const scope = sourceCode.getScope(node);
        const exemptions: CallExemptions = { allowed, scope, services };

        reportCalls(calls, node, exemptions);

        for (const identifier of identifiers) {
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
