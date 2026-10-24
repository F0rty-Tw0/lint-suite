import { lineBreakOf } from '@lint-suite/rule-internals/utils/line-break.util.ts';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { isExemptCall } from './call-exemptions.util.ts';
import { calleeName } from './condition-calls.util.ts';
import { HOISTABLE_PARENTS } from '../common/no-call-in-condition.const.ts';
import type {
  CallReporter,
  HoistTarget,
  MessageIds,
  RuleContext
} from '../common/no-call-in-condition.type.ts';

type Suggestions = TSESLint.SuggestionReportDescriptor<MessageIds>[];

const INDENT_PATTERN = /^[\t ]*/u;

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
  const lineBreak = lineBreakOf(sourceCode.text);
  const declaration = `const ${constName} = ${callText};${lineBreak}${indent}`;
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

export const callReporter = (context: RuleContext): CallReporter => {
  const { sourceCode } = context;
  const reported = new Set<TSESTree.CallExpression>();
  const reportCalls: CallReporter = (calls, statement, exemptions) => {
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

  return reportCalls;
};
