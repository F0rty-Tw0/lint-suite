import type { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import {
  eslintRun,
  oxlintRows,
  rowsInBoth,
  rowsUncovered
} from './missing-run.spec.util.ts';
import type { OxlintDiagnostic } from '../common/smoke.type.ts';
import {
  LINT_MESSAGE_STUB,
  LINT_RESULT_STUB
} from '../stubs/missing-run.stub.ts';

const diagnostic: OxlintDiagnostic = {
  code: 'local(one-line-guard)',
  filename: 'a.ts',
  message: 'm'
};

describe('FEATURE: real-run row helpers', () => {
  describe('GIVEN oxlint diagnostics', () => {
    it('WHEN a code is a plugin rule THEN the row is file and ESLint rule id', () => {
      const rows = oxlintRows([diagnostic]);

      expect(rows).toEqual(['a.ts|local/one-line-guard']);
    });

    it('WHEN a code is a core rule THEN the row drops the eslint prefix', () => {
      const core: OxlintDiagnostic = {
        ...diagnostic,
        code: 'eslint(no-console)'
      };

      const rows = oxlintRows([core]);

      expect(rows).toEqual(['a.ts|no-console']);
    });

    it('WHEN a code is a TypeScript extension rule THEN both ESLint ids are rows', () => {
      const extension: OxlintDiagnostic = {
        ...diagnostic,
        code: 'eslint(no-unused-vars)'
      };

      const rows = oxlintRows([extension]);

      expect(rows).toEqual([
        'a.ts|@typescript-eslint/no-unused-vars',
        'a.ts|no-unused-vars'
      ]);
    });

    it('WHEN a code is a native TypeScript rule THEN the row uses the @typescript-eslint prefix', () => {
      const native: OxlintDiagnostic = {
        ...diagnostic,
        code: 'typescript(no-explicit-any)'
      };

      const rows = oxlintRows([native]);

      expect(rows).toEqual(['a.ts|@typescript-eslint/no-explicit-any']);
    });

    it('WHEN a code is a native import rule THEN the row uses the import-x prefix', () => {
      const native: OxlintDiagnostic = { ...diagnostic, code: 'import(first)' };

      const rows = oxlintRows([native]);

      expect(rows).toEqual(['a.ts|import-x/first']);
    });

    it('WHEN a diagnostic has no code THEN it adds no row', () => {
      const crash: OxlintDiagnostic = { ...diagnostic, code: '' };

      const rows = oxlintRows([crash]);

      expect(rows).toEqual([]);
    });

    it('WHEN a diagnostic repeats THEN its row appears once', () => {
      const rows = oxlintRows([diagnostic, diagnostic]);

      expect(rows).toEqual(['a.ts|local/one-line-guard']);
    });
  });

  describe('GIVEN ESLint results', () => {
    it('WHEN a message has a rule id THEN the row uses the path relative to the workspace', () => {
      const result = { ...LINT_RESULT_STUB, messages: [LINT_MESSAGE_STUB] };

      const run = eslintRun('ws', [result]);

      expect(run.rows).toEqual(['a.ts|no-console']);
    });

    it('WHEN a message has no rule id THEN it adds no row', () => {
      const unnamed = { ...LINT_MESSAGE_STUB, ruleId: null };
      const result = { ...LINT_RESULT_STUB, messages: [unnamed] };

      const run = eslintRun('ws', [result]);

      expect(run.rows).toEqual([]);
    });

    it('WHEN a message is fatal THEN it is listed as a fatal', () => {
      const parsing: Linter.LintMessage = {
        ...LINT_MESSAGE_STUB,
        ruleId: null,
        fatal: true
      };
      const result = { ...LINT_RESULT_STUB, messages: [parsing] };

      const run = eslintRun('ws', [result]);

      expect(run.fatals).toEqual(['a.ts|m']);
    });
  });

  describe('GIVEN two row lists', () => {
    it('WHEN rows overlap THEN rowsInBoth lists the shared rows', () => {
      const shared = rowsInBoth(['a', 'b'], ['b', 'c']);

      expect(shared).toEqual(['b']);
    });

    it('WHEN a row is in no covering list THEN rowsUncovered lists it', () => {
      const uncovered = rowsUncovered(['a', 'b', 'c'], [['a'], ['b']]);

      expect(uncovered).toEqual(['c']);
    });
  });
});
