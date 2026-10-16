import { describe, expect, it } from 'vitest';

import { typescriptSafety } from './typescript-safety.ts';
import { fileUrlFlags, ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: typescriptSafety', () => {
  describe('GIVEN a TypeScript file', () => {
    it('WHEN local/one-line-guard is read THEN it carries the line length', () => {
      const rule = 'local/one-line-guard';
      const entry = ruleAt(typescriptSafety, 'src/a.ts', rule);

      expect(entry).toEqual(['error', { maxLineLength: 135 }]);
    });

    it('WHEN typescript/no-explicit-any is read THEN it is an error', () => {
      const rule = 'typescript/no-explicit-any';
      const entry = ruleAt(typescriptSafety, 'src/a.ts', rule);

      expect(entry).toBe('error');
    });

    it('WHEN local/no-unused-exports is read THEN it is absent because it needs type info', () => {
      const rule = 'local/no-unused-exports';
      const entry = ruleAt(typescriptSafety, 'src/a.ts', rule);

      expect(entry).toBeUndefined();
    });
  });

  describe('GIVEN a JavaScript file', () => {
    it('WHEN local/one-line-guard is read THEN it is absent', () => {
      const rule = 'local/one-line-guard';
      const entry = ruleAt(typescriptSafety, 'src/a.js', rule);

      expect(entry).toBeUndefined();
    });
  });

  describe('GIVEN the config', () => {
    it('WHEN its JS plugin specifiers are read THEN local and eslint-js are file URLs', () => {
      const flags = fileUrlFlags(typescriptSafety);

      expect(flags).toEqual([true, true]);
    });
  });
});
