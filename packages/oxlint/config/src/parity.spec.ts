import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PARITY_SAMPLES } from './test/common/parity.const.ts';
import {
  eslintConfigFor,
  eslintEnabledAcross
} from './test/utils/eslint-sample-config.spec.util.ts';
import {
  deviationCauseDiff,
  duplicateCauseDiff,
  staleRowDiff
} from './test/utils/missing-table-diff.spec.util.ts';
import { readMissing } from './test/utils/missing-table.spec.util.ts';
import { parityPasses } from './test/utils/parity-passes.spec.util.ts';
import { parityDiff } from './test/utils/parity.spec.util.ts';
import { resolveOxlintConfig } from './utils/resolve-oxlint-config.util.ts';

const missingPath = join(import.meta.dirname, '..', 'MISSING.md');
const missingText = readFileSync(missingPath, 'utf8');
const missing = readMissing(missingText);
const parityPassList = parityPasses();

describe('FEATURE: oxlint config parity', () => {
  for (const pass of parityPassList) {
    describe(pass.title, () => {
      it.each(PARITY_SAMPLES)(
        'WHEN %s is linted THEN oxlint matches the ESLint rules, settings and globals',
        async (sample) => {
          const eslint = await eslintConfigFor(pass.eslint, sample);
          const oxlint = resolveOxlintConfig(pass.oxlint, sample);
          const typeAware = pass.typeAware;
          const input = {
            pass: pass.title,
            sample,
            eslint,
            oxlint,
            missing,
            typeAware
          };

          const diffs = parityDiff(input);

          expect(diffs).toEqual([]);
        }
      );
    });
  }

  describe('GIVEN the MISSING.md tables', () => {
    it('WHEN the cause tables are read THEN no rule is in two of them', () => {
      const diffs = duplicateCauseDiff(missing);

      expect(diffs).toEqual([]);
    });

    it('WHEN the option deviations are read THEN none of them is in a cause table', () => {
      const diffs = deviationCauseDiff(missing);

      expect(diffs).toEqual([]);
    });

    it('WHEN every listed rule is checked THEN ESLint enables it in some pass and sample', async () => {
      const enabled = await eslintEnabledAcross(parityPassList, PARITY_SAMPLES);

      const diffs = staleRowDiff(missing, enabled);

      expect(diffs).toEqual([]);
    });
  });
});
