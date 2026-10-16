import { describe, expect, it } from 'vitest';

import { javascriptRecommended } from './javascript-recommended.ts';
import { javascript } from './javascript.ts';
import { resolveOxlintConfig } from '../utils/resolve-oxlint-config.util.ts';

describe('FEATURE: javascript', () => {
  describe('GIVEN the config', () => {
    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = javascript.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });

    it('WHEN its parts are read THEN it extends the recommended rules', () => {
      const parts = javascript.extends;

      expect(parts).toEqual([javascriptRecommended]);
    });

    it('WHEN its top-level globals are read THEN none are set', () => {
      const globals = javascript.globals;

      expect(globals).toBeUndefined();
    });
  });

  describe('GIVEN a JavaScript file', () => {
    it('WHEN its globals are resolved THEN browser and node names are read-only or writable', () => {
      const resolved = resolveOxlintConfig(javascript, 'src/a.js');

      expect(resolved.globals).toMatchObject({
        window: 'readonly',
        location: 'writable'
      });
    });
  });

  describe('GIVEN a TypeScript file', () => {
    it('WHEN its globals are resolved THEN there are none', () => {
      const resolved = resolveOxlintConfig(javascript, 'src/a.ts');

      expect(resolved.globals).toEqual({});
    });
  });
});
