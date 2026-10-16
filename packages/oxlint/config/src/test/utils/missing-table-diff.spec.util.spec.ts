import { describe, expect, it } from 'vitest';

import {
  deviationCauseDiff,
  duplicateCauseDiff,
  staleRowDiff
} from './missing-table-diff.spec.util.ts';
import type { MissingTable } from '../common/missing.type.ts';
import { MISSING_TABLE_STUB } from '../stubs/missing.stub.ts';

const duplicated: MissingTable = {
  ...MISSING_TABLE_STUB,
  duplicates: new Map([['r', ['A', 'B']]])
};

const deviationWithCause: MissingTable = {
  ...MISSING_TABLE_STUB,
  causes: new Map([['r', 'A']]),
  deviations: new Set(['r'])
};

const deviationOnly: MissingTable = {
  ...MISSING_TABLE_STUB,
  deviations: new Set(['r'])
};

const listedRows: MissingTable = {
  ...MISSING_TABLE_STUB,
  causes: new Map([['r', 'A']]),
  deviations: new Set(['d'])
};

describe('FEATURE: MISSING.md table diffs', () => {
  describe('GIVEN a rule listed under two causes', () => {
    it('WHEN duplicates are diffed THEN both causes are reported', () => {
      const diffs = duplicateCauseDiff(duplicated);

      expect(diffs).toEqual(['[MISSING.md] r: duplicate cause (A; B)']);
    });
  });

  describe('GIVEN no duplicated rule', () => {
    it('WHEN duplicates are diffed THEN nothing is reported', () => {
      const diffs = duplicateCauseDiff(MISSING_TABLE_STUB);

      expect(diffs).toEqual([]);
    });
  });

  describe('GIVEN an option deviation', () => {
    it('WHEN it is also under a cause THEN the cause is reported', () => {
      const diffs = deviationCauseDiff(deviationWithCause);

      expect(diffs).toEqual([
        '[MISSING.md] r: duplicate cause (option deviation also under "A")'
      ]);
    });

    it('WHEN it is under no cause THEN nothing is reported', () => {
      const diffs = deviationCauseDiff(deviationOnly);

      expect(diffs).toEqual([]);
    });
  });

  describe('GIVEN a cause row and a deviation row', () => {
    it('WHEN ESLint enables neither THEN both rows are reported stale', () => {
      const enabled = new Set<string>();

      const diffs = staleRowDiff(listedRows, enabled);

      expect(diffs).toEqual([
        '[MISSING.md] r: stale (ESLint never enables it)',
        '[MISSING.md] d: stale (ESLint never enables it)'
      ]);
    });

    it('WHEN ESLint enables both THEN nothing is reported', () => {
      const enabled = new Set(['r', 'd']);

      const diffs = staleRowDiff(listedRows, enabled);

      expect(diffs).toEqual([]);
    });
  });
});
