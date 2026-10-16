import { describe, expect, it } from 'vitest';

import { baseLimits } from './base-limits.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

const SOURCE_CAP = [
  'error',
  { max: 150, skipBlankLines: true, skipComments: true }
];
const SPEC_CAP = [
  'error',
  { max: 300, skipBlankLines: true, skipComments: true }
];

describe('FEATURE: baseLimits', () => {
  describe('GIVEN a source file', () => {
    it('WHEN eslint/max-lines is read THEN the cap is 150', () => {
      const entry = ruleAt(baseLimits, 'src/a.ts', 'eslint/max-lines');

      expect(entry).toEqual(SOURCE_CAP);
    });
  });

  describe('GIVEN a spec file', () => {
    it('WHEN eslint/max-lines is read THEN the cap is 300', () => {
      const entry = ruleAt(baseLimits, 'src/a.spec.ts', 'eslint/max-lines');

      expect(entry).toEqual(SPEC_CAP);
    });

    it('WHEN eslint/complexity is read THEN the cap is 3', () => {
      const entry = ruleAt(baseLimits, 'src/a.spec.ts', 'eslint/complexity');

      expect(entry).toEqual(['warn', { max: 3 }]);
    });

    it('WHEN eslint/max-lines-per-function is read THEN it is off', () => {
      const rule = 'eslint/max-lines-per-function';
      const entry = ruleAt(baseLimits, 'src/a.spec.ts', rule);

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN a state file', () => {
    it('WHEN eslint/class-methods-use-this is read THEN it is off', () => {
      const rule = 'eslint/class-methods-use-this';
      const entry = ruleAt(baseLimits, 'src/a.state.ts', rule);

      expect(entry).toBe('off');
    });
  });
});
