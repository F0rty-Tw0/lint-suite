import { describe, expect, it } from 'vitest';

import { vitest } from './vitest.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: vitest', () => {
  describe('GIVEN the config', () => {
    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = vitest.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });

    it('WHEN its plugins are read THEN the native vitest plugin is on', () => {
      const plugins = vitest.plugins;

      expect(plugins).toEqual(['vitest']);
    });

    it('WHEN its top-level jsPlugins are read THEN none are set', () => {
      const jsPlugins = vitest.jsPlugins;

      expect(jsPlugins).toBeUndefined();
    });
  });

  describe('GIVEN a spec file', () => {
    it.each(['src/a.spec.ts', 'src/a.test.ts', 'src/a.spec.js'])(
      'WHEN %s is read THEN max-nested-describe caps at three',
      (file) => {
        const entry = ruleAt(vitest, file, 'vitest/max-nested-describe');

        expect(entry).toEqual(['error', { max: 3 }]);
      }
    );

    it('WHEN prefer-strict-equal is read THEN it is a warning', () => {
      const rule = 'vitest/prefer-strict-equal';
      const entry = ruleAt(vitest, 'src/a.spec.ts', rule);

      expect(entry).toBe('warn');
    });

    it('WHEN no-focused-tests is read THEN it carries no options', () => {
      const rule = 'vitest/no-focused-tests';
      const entry = ruleAt(vitest, 'src/a.spec.ts', rule);

      expect(entry).toBe('error');
    });
  });

  describe('GIVEN a non-spec file', () => {
    it.each(['src/a.ts', 'src/a.e2e.ts'])(
      'WHEN %s is read THEN vitest rules are absent',
      (file) => {
        const entry = ruleAt(vitest, file, 'vitest/valid-title');

        expect(entry).toBeUndefined();
      }
    );
  });
});
