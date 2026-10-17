import { describe, expect, it } from 'vitest';

import {
  isReported,
  parseDiagnostics,
  toDiagnosticCode
} from './oxlint-report.spec.util.ts';
import type { OxlintDiagnostic, SmokeTrigger } from '../common/smoke.type.ts';

const diagnostic: OxlintDiagnostic = {
  code: 'local(one-line-guard)',
  filename: 'a/b.ts',
  message: 'm'
};
const trigger: SmokeTrigger = { rule: 'local/one-line-guard', file: 'a/b.ts' };

describe('FEATURE: oxlint report helpers', () => {
  describe('GIVEN a rule name', () => {
    it('WHEN the plugin is plain THEN the code wraps the rule in parentheses', () => {
      const code = toDiagnosticCode('local/one-line-guard');

      expect(code).toBe('local(one-line-guard)');
    });

    it('WHEN the plugin is scoped THEN only the last segment is the rule', () => {
      const code = toDiagnosticCode('@smarttools/rxjs/no-sharereplay');

      expect(code).toBe('@smarttools/rxjs(no-sharereplay)');
    });
  });

  describe('GIVEN a JSON report', () => {
    it('WHEN a diagnostic has no code THEN its code is empty and its path uses slashes', () => {
      const entry = {
        message: 'Error running JS plugin.',
        filename: 'a\\b.ts'
      };
      const report = JSON.stringify({ diagnostics: [entry] });

      const parsed = parseDiagnostics(report);

      expect(parsed).toEqual([
        { code: '', filename: 'a/b.ts', message: 'Error running JS plugin.' }
      ]);
    });

    it('WHEN the report has no diagnostics list THEN parsing throws', () => {
      const parse = (): unknown => parseDiagnostics('{}');

      expect(parse).toThrow('no diagnostics list');
    });

    it('WHEN the report is not an object THEN parsing throws', () => {
      const parse = (): unknown => parseDiagnostics('1');

      expect(parse).toThrow('not an object');
    });

    it('WHEN a diagnostic is not an object THEN parsing throws', () => {
      const report = JSON.stringify({ diagnostics: [1] });

      const parse = (): unknown => parseDiagnostics(report);

      expect(parse).toThrow('not an object');
    });
  });

  describe('GIVEN a trigger', () => {
    it('WHEN a diagnostic has its code and file THEN it is reported', () => {
      const reported = isReported([diagnostic], trigger);

      expect(reported).toBe(true);
    });

    it('WHEN the file differs THEN it is not reported', () => {
      const other: OxlintDiagnostic = { ...diagnostic, filename: 'c.ts' };

      const reported = isReported([other], trigger);

      expect(reported).toBe(false);
    });

    it('WHEN the code differs THEN it is not reported', () => {
      const other: OxlintDiagnostic = { ...diagnostic, code: 'x(y)' };

      const reported = isReported([other], trigger);

      expect(reported).toBe(false);
    });
  });
});
