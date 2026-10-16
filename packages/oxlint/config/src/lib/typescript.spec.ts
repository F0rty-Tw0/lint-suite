import { describe, expect, it } from 'vitest';

import { typescriptConsistency } from './typescript-consistency.ts';
import { typescriptImports } from './typescript-imports.ts';
import { typescriptOverrides } from './typescript-overrides.ts';
import { typescriptRecommended } from './typescript-recommended.ts';
import { typescriptSafety } from './typescript-safety.ts';
import { typescript } from './typescript.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: typescript', () => {
  describe('GIVEN the config', () => {
    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = typescript.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });

    it('WHEN its plugins are read THEN import is native', () => {
      const plugins = typescript.plugins;

      expect(plugins).toEqual(['import']);
    });

    it('WHEN its parts are read THEN overrides come last', () => {
      const parts = [
        typescriptRecommended,
        typescriptSafety,
        typescriptConsistency,
        typescriptImports,
        typescriptOverrides
      ];

      expect(typescript.extends).toEqual(parts);
    });
  });

  describe('GIVEN a spec file', () => {
    it('WHEN eslint/no-empty-function is read THEN the override wins', () => {
      const rule = 'eslint/no-empty-function';
      const entry = ruleAt(typescript, 'src/a.spec.ts', rule);

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN a TypeScript file', () => {
    it('WHEN typescript/prefer-for-of is read THEN it is an error', () => {
      const rule = 'typescript/prefer-for-of';
      const entry = ruleAt(typescript, 'src/a.ts', rule);

      expect(entry).toBe('error');
    });

    it('WHEN a type-aware rule is read THEN it is absent', () => {
      const rule = 'typescript/no-floating-promises';
      const entry = ruleAt(typescript, 'src/a.ts', rule);

      expect(entry).toBeUndefined();
    });
  });
});
