import { describe, expect, it } from 'vitest';

import { javascriptRecommended } from './javascript-recommended.ts';
import { fileUrlFlags, ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: javascriptRecommended', () => {
  describe('GIVEN a JavaScript file', () => {
    it('WHEN eslint/no-undef is read THEN it is an error', () => {
      const rule = 'eslint/no-undef';
      const entry = ruleAt(javascriptRecommended, 'src/a.js', rule);

      expect(entry).toEqual(['error', { typeof: false }]);
    });

    it('WHEN eslint-js/no-dupe-args is read THEN it is an error', () => {
      const rule = 'eslint-js/no-dupe-args';
      const entry = ruleAt(javascriptRecommended, 'src/a.mjs', rule);

      expect(entry).toBe('error');
    });
  });

  describe('GIVEN a TypeScript file', () => {
    it('WHEN eslint/no-undef is read THEN it is absent', () => {
      const rule = 'eslint/no-undef';
      const entry = ruleAt(javascriptRecommended, 'src/a.ts', rule);

      expect(entry).toBeUndefined();
    });

    it('WHEN eslint/for-direction is read THEN it is an error', () => {
      const rule = 'eslint/for-direction';
      const entry = ruleAt(javascriptRecommended, 'src/a.ts', rule);

      expect(entry).toBe('error');
    });
  });

  describe('GIVEN the config', () => {
    it('WHEN its JS plugin specifiers are read THEN eslint-js is a file URL', () => {
      const flags = fileUrlFlags(javascriptRecommended);

      expect(flags).toEqual([true]);
    });
  });
});
