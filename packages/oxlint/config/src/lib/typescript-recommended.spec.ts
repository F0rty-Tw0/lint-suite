import { describe, expect, it } from 'vitest';

import { typescriptRecommended } from './typescript-recommended.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: typescriptRecommended', () => {
  describe('GIVEN a TypeScript file', () => {
    it('WHEN typescript/ban-ts-comment is read THEN it is an error', () => {
      const rule = 'typescript/ban-ts-comment';
      const entry = ruleAt(typescriptRecommended, 'src/a.ts', rule);

      expect(entry).toBe('error');
    });

    it('WHEN typescript/adjacent-overload-signatures is read THEN it is an error', () => {
      const rule = 'typescript/adjacent-overload-signatures';
      const entry = ruleAt(typescriptRecommended, 'src/a.mts', rule);

      expect(entry).toBe('error');
    });
  });

  describe('GIVEN a JavaScript file', () => {
    it('WHEN typescript/ban-ts-comment is read THEN it is absent', () => {
      const rule = 'typescript/ban-ts-comment';
      const entry = ruleAt(typescriptRecommended, 'src/a.js', rule);

      expect(entry).toBeUndefined();
    });
  });
});
