import { relative } from 'node:path';

import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import type { CompatibleConfigArray } from 'typescript-eslint';

import { toCanonicalRuleKey } from '../../utils/rule-key.util.ts';
import { toEslintRuleNames } from '../../utils/rule-name.util.ts';
import {
  MISSING_RUN_PATTERNS,
  ROW_SEPARATOR
} from '../common/missing-run.const.ts';
import type { EslintRun } from '../common/missing-run.type.ts';
import type { OxlintDiagnostic } from '../common/smoke.type.ts';

const toRow = (file: string, rule: string): string => {
  return `${file}${ROW_SEPARATOR}${rule}`;
};

const toRuleKey = (code: string): string => {
  const open = code.lastIndexOf('(');
  const plugin = code.slice(0, open);
  const name = code.slice(open + 1, -1);

  return `${plugin}/${name}`;
};

const toOxlintRows = (diagnostic: OxlintDiagnostic): string[] => {
  const key = toCanonicalRuleKey(toRuleKey(diagnostic.code));
  const names = toEslintRuleNames(key);

  return names.map((name) => toRow(diagnostic.filename, name));
};

export const oxlintRows = (diagnostics: OxlintDiagnostic[]): string[] => {
  const hasCode = (diagnostic: OxlintDiagnostic): boolean => {
    return diagnostic.code.endsWith(')');
  };
  const coded = diagnostics.filter(hasCode);
  const rows = coded.flatMap(toOxlintRows);

  return Array.from(new Set(rows)).sort();
};

const isFatal = (message: Linter.LintMessage): boolean => {
  return message.fatal === true;
};

const toRuleRows = (file: string, messages: Linter.LintMessage[]): string[] => {
  const rows: string[] = [];

  for (const message of messages) {
    if (message.ruleId === null) continue;

    rows.push(toRow(file, message.ruleId));
  }

  return rows;
};

const toFatalRows = (
  file: string,
  messages: Linter.LintMessage[]
): string[] => {
  const fatal = messages.filter(isFatal);

  return fatal.map((message) => toRow(file, message.message));
};

export const eslintRun = (
  workspace: string,
  results: ESLint.LintResult[]
): EslintRun => {
  const rows: string[] = [];
  const fatals: string[] = [];

  for (const result of results) {
    const path = relative(workspace, result.filePath);
    const file = path.replaceAll('\\', '/');

    const ruleRows = toRuleRows(file, result.messages);
    const fatalRows = toFatalRows(file, result.messages);

    rows.push(...ruleRows);
    fatals.push(...fatalRows);
  }

  const unique = Array.from(new Set(rows)).sort();
  const run: EslintRun = { rows: unique, fatals };

  return run;
};

export const runEslint = async (
  workspace: string,
  config: CompatibleConfigArray
): Promise<EslintRun> => {
  const eslint = new ESLint({
    cwd: workspace,
    overrideConfigFile: true,
    overrideConfig: config
  });
  const results = await eslint.lintFiles(MISSING_RUN_PATTERNS);

  return eslintRun(workspace, results);
};

export const rowsInBoth = (left: string[], right: string[]): string[] => {
  const isInRight = (row: string): boolean => right.includes(row);

  return left.filter(isInRight);
};

export const rowsUncovered = (
  rows: string[],
  coveredBy: string[][]
): string[] => {
  const isUncovered = (row: string): boolean => {
    const isCovered = (covering: string[]): boolean => covering.includes(row);

    return !coveredBy.some(isCovered);
  };

  return rows.filter(isUncovered);
};
