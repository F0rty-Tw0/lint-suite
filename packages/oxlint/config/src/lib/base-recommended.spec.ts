import { describe, expect, it } from 'vitest';

import { baseRecommended } from './base-recommended.ts';
import { fileUrlFlags, ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: baseRecommended', () => {
  describe('GIVEN a TypeScript file', () => {
    it('WHEN import/export is read THEN it is an error', () => {
      const entry = ruleAt(baseRecommended, 'src/a.ts', 'import/export');

      expect(entry).toBe('error');
    });

    it('WHEN import/named is read THEN it is absent', () => {
      const entry = ruleAt(baseRecommended, 'src/a.ts', 'import/named');

      expect(entry).toBeUndefined();
    });
  });

  describe('GIVEN a JavaScript file', () => {
    it('WHEN import/named is read THEN it is an error', () => {
      const entry = ruleAt(baseRecommended, 'src/a.js', 'import/named');

      expect(entry).toBe('error');
    });
  });

  describe('GIVEN the config', () => {
    it('WHEN its plugins are read THEN import is native', () => {
      const plugins = baseRecommended.plugins;

      expect(plugins).toEqual(['import']);
    });

    it('WHEN its JS plugin specifiers are read THEN @stylistic is a file URL', () => {
      const flags = fileUrlFlags(baseRecommended);

      expect(flags).toEqual([true]);
    });
  });
});
