import { describe, expect, it } from 'vitest';

import { baseLimits } from './base-limits.ts';
import { basePractices } from './base-practices.ts';
import { baseRecommended } from './base-recommended.ts';
import { base } from './base.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: base', () => {
  describe('GIVEN the config', () => {
    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = base.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });

    it('WHEN its plugins are read THEN import is native', () => {
      const plugins = base.plugins;

      expect(plugins).toEqual(['import']);
    });

    it('WHEN its parts are read THEN they are recommended, practices and limits', () => {
      const parts = [baseRecommended, basePractices, baseLimits];

      expect(base.extends).toEqual(parts);
    });
  });

  describe('GIVEN a spec file', () => {
    it('WHEN eslint/no-var is read THEN the practices still apply', () => {
      const entry = ruleAt(base, 'src/a.spec.ts', 'eslint/no-var');

      expect(entry).toBe('error');
    });
  });
});
