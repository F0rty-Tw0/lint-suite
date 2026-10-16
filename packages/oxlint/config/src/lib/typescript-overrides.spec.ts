import { describe, expect, it } from 'vitest';

import { typescriptOverrides } from './typescript-overrides.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: typescriptOverrides', () => {
  describe('GIVEN a spec file', () => {
    it('WHEN eslint/no-empty-function is read THEN it is off', () => {
      const rule = 'eslint/no-empty-function';
      const entry = ruleAt(typescriptOverrides, 'src/a.spec.ts', rule);

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN an action file', () => {
    it('WHEN typescript/parameter-properties is read THEN it is off', () => {
      const rule = 'typescript/parameter-properties';
      const entry = ruleAt(typescriptOverrides, 'src/a.action.ts', rule);

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN a stub file', () => {
    it('WHEN typescript/no-inferrable-types is read THEN it is off', () => {
      const rule = 'typescript/no-inferrable-types';
      const entry = ruleAt(typescriptOverrides, 'src/a.stub.ts', rule);

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN a story file', () => {
    it('WHEN typescript/consistent-type-assertions is read THEN it is off', () => {
      const rule = 'typescript/consistent-type-assertions';
      const entry = ruleAt(typescriptOverrides, 'src/a.stories.ts', rule);

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN a plain TypeScript file', () => {
    it('WHEN typescript/no-namespace is read THEN nothing is overridden', () => {
      const rule = 'typescript/no-namespace';
      const entry = ruleAt(typescriptOverrides, 'src/a.ts', rule);

      expect(entry).toBeUndefined();
    });
  });
});
