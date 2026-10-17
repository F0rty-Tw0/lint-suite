import { describe, expect, it } from 'vitest';

import { typescriptTypeAware } from './typescript-type-aware.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: typescriptTypeAware', () => {
  describe('GIVEN the config', () => {
    it('WHEN its options are read THEN type-aware mode is on', () => {
      const options = typescriptTypeAware.options;

      expect(options).toEqual({ typeAware: true });
    });

    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = typescriptTypeAware.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });
  });

  describe('GIVEN a TypeScript file', () => {
    it('WHEN typescript/no-floating-promises is read THEN it carries ignoreVoid', () => {
      const rule = 'typescript/no-floating-promises';
      const entry = ruleAt(typescriptTypeAware, 'src/a.ts', rule);

      expect(entry).toEqual(['error', { ignoreVoid: true }]);
    });

    it('WHEN typescript/no-misused-promises is read THEN it is a warning', () => {
      const rule = 'typescript/no-misused-promises';
      const entry = ruleAt(typescriptTypeAware, 'src/a.ts', rule);

      expect(entry).toBe('warn');
    });

    it('WHEN typescript/return-await is read THEN it is in-try-catch', () => {
      const rule = 'typescript/return-await';
      const entry = ruleAt(typescriptTypeAware, 'src/a.ts', rule);

      expect(entry).toEqual(['error', 'in-try-catch']);
    });
  });

  describe('GIVEN a JavaScript file', () => {
    it('WHEN typescript/await-thenable is read THEN it is absent', () => {
      const rule = 'typescript/await-thenable';
      const entry = ruleAt(typescriptTypeAware, 'src/a.js', rule);

      expect(entry).toBeUndefined();
    });
  });
});
