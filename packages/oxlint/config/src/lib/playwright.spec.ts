import { describe, expect, it } from 'vitest';

import { playwright } from './playwright.ts';
import { recommended } from './recommended.ts';
import { fileUrlFlags, ruleAt } from '../test/utils/preset.spec.util.ts';
import { defineLintSuiteConfig } from '../utils/define-lint-suite-config.util.ts';
import { resolveOxlintConfig } from '../utils/resolve-oxlint-config.util.ts';

const composed = defineLintSuiteConfig(recommended, playwright);

describe('FEATURE: playwright', () => {
  describe('GIVEN the config', () => {
    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = playwright.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });

    it('WHEN its JS plugin specifiers are read THEN the plugin is a file URL', () => {
      const flags = fileUrlFlags(playwright);

      expect(flags).toEqual([true]);
    });

    it('WHEN its top-level globals are read THEN none are set', () => {
      const globals = playwright.globals;

      expect(globals).toBeUndefined();
    });
  });

  describe('GIVEN an e2e file', () => {
    it.each(['src/a.e2e.ts', 'src/a.e2e.js'])(
      'WHEN %s is read THEN no-magic-timeouts is an error',
      (file) => {
        const entry = ruleAt(playwright, file, 'playwright/no-magic-timeouts');

        expect(entry).toBe('error');
      }
    );

    it('WHEN its globals are resolved THEN the shared names are read-only', () => {
      const resolved = resolveOxlintConfig(playwright, 'src/a.e2e.ts');

      expect(resolved.globals['fetch']).toBe('readonly');
    });

    it('WHEN it is composed after recommended THEN no-empty-pattern is off', () => {
      const entry = ruleAt(composed, 'src/a.e2e.ts', 'eslint/no-empty-pattern');

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN a spec file', () => {
    it('WHEN it is composed after recommended THEN no-empty-pattern stays on', () => {
      const entry = ruleAt(
        composed,
        'src/a.spec.ts',
        'eslint/no-empty-pattern'
      );

      expect(entry).toEqual([
        'error',
        { allowObjectPatternsAsParameters: false }
      ]);
    });

    it('WHEN a playwright rule is read THEN it is absent', () => {
      const rule = 'playwright/valid-title';
      const entry = ruleAt(playwright, 'src/a.spec.ts', rule);

      expect(entry).toBeUndefined();
    });
  });
});
