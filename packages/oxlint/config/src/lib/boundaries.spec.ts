import { describe, expect, it } from 'vitest';

import { boundaries } from './boundaries.ts';
import { fileUrlFlags, ruleAt } from '../test/utils/preset.spec.util.ts';
import { resolveOxlintConfig } from '../utils/resolve-oxlint-config.util.ts';

describe('FEATURE: boundaries', () => {
  describe('GIVEN a TypeScript file', () => {
    it('WHEN boundaries/dependencies is read THEN it disallows by default', () => {
      const entry = ruleAt(boundaries, 'src/a.ts', 'boundaries/dependencies');

      expect(entry).toMatchObject(['error', { default: 'disallow' }]);
    });

    it('WHEN its settings are resolved THEN the elements and the resolver are set', () => {
      const resolved = resolveOxlintConfig(boundaries, 'src/a.ts');

      const keys = Object.keys(resolved.settings);

      expect(keys).toEqual(['boundaries/elements', 'import/resolver']);
    });
  });

  describe('GIVEN a story file', () => {
    it('WHEN boundaries/dependencies is read THEN it is off', () => {
      const rule = 'boundaries/dependencies';
      const entry = ruleAt(boundaries, 'src/a.stories.ts', rule);

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN a CommonJS file', () => {
    it('WHEN modular-boundaries is read THEN it is absent', () => {
      const rule = 'modular-boundaries/modular-boundaries';
      const entry = ruleAt(boundaries, 'src/a.cjs', rule);

      expect(entry).toBeUndefined();
    });
  });

  describe('GIVEN the config', () => {
    it('WHEN its top-level globals are read THEN none are set', () => {
      const globals = boundaries.globals;

      expect(globals).toBeUndefined();
    });

    it('WHEN its top-level env are read THEN none are set', () => {
      const env = boundaries.env;

      expect(env).toBeUndefined();
    });

    it('WHEN its JS plugin specifiers are read THEN both plugins are file URLs', () => {
      const flags = fileUrlFlags(boundaries);

      expect(flags).toEqual([true, true]);
    });
  });
});
