import { describe, expect, it } from 'vitest';

import { parseRunOutput } from './oxlint-run.spec.util.ts';
import type { OxlintRun } from '../common/smoke.type.ts';

const failedRun: OxlintRun = {
  status: 1,
  stdout: '',
  stderr: 'Failed to parse oxlint.config.ts'
};

const parseJson = (stdout: string): unknown => JSON.parse(stdout);

describe('FEATURE: parse oxlint run output', () => {
  describe('GIVEN a run with parsable stdout', () => {
    it('WHEN it is parsed THEN the parsed value is returned', () => {
      const run: OxlintRun = { ...failedRun, status: 0, stdout: '[1]' };

      const parsed = parseRunOutput(run, parseJson);

      expect(parsed).toEqual([1]);
    });
  });

  describe('GIVEN a run whose stdout does not parse', () => {
    it('WHEN it is parsed THEN the error carries the stderr', () => {
      const parse = (): unknown => parseRunOutput(failedRun, parseJson);

      expect(parse).toThrow(
        'oxlint output did not parse: Failed to parse oxlint.config.ts'
      );
    });
  });
});
