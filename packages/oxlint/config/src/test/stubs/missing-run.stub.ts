import type { ESLint, Linter } from 'eslint';

export const LINT_MESSAGE_STUB: Linter.LintMessage = {
  ruleId: 'no-console',
  severity: 2,
  message: 'm',
  line: 1,
  column: 1
};

export const LINT_RESULT_STUB: ESLint.LintResult = {
  filePath: 'ws/a.ts',
  messages: [],
  suppressedMessages: [],
  errorCount: 0,
  fatalErrorCount: 0,
  warningCount: 0,
  fixableErrorCount: 0,
  fixableWarningCount: 0,
  usedDeprecatedRules: []
};
