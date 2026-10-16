import { describe, expect, it } from 'vitest';

import { recommended } from './recommended.ts';
import { storybook } from './storybook.ts';
import { fileUrlFlags, ruleAt } from '../test/utils/preset.spec.util.ts';
import { defineLintSuiteConfig } from '../utils/define-lint-suite-config.util.ts';

const composed = defineLintSuiteConfig(recommended, storybook);
const ANONYMOUS_EXPORT = 'import/no-anonymous-default-export';

describe('FEATURE: storybook', () => {
  describe('GIVEN the config', () => {
    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = storybook.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });

    it('WHEN its JS plugin specifiers are read THEN the plugin is a file URL', () => {
      const flags = fileUrlFlags(storybook);

      expect(flags).toEqual([true]);
    });

    it('WHEN its ignores are read THEN none are set', () => {
      const ignorePatterns = storybook.ignorePatterns;

      expect(ignorePatterns).toBeUndefined();
    });
  });

  describe('GIVEN a story file', () => {
    it('WHEN no-stories-of is read THEN it is an error', () => {
      const rule = 'storybook/no-stories-of';
      const entry = ruleAt(storybook, 'src/a.stories.ts', rule);

      expect(entry).toBe('error');
    });

    it('WHEN csf-component is read THEN it is a warning', () => {
      const rule = 'storybook/csf-component';
      const entry = ruleAt(storybook, 'src/a.stories.ts', rule);

      expect(entry).toBe('warn');
    });

    it('WHEN it is composed after recommended THEN no-anonymous-default-export is off', () => {
      const entry = ruleAt(composed, 'src/a.stories.ts', ANONYMOUS_EXPORT);

      expect(entry).toBe('off');
    });
  });

  describe('GIVEN a TSX story file', () => {
    it('WHEN no-stories-of is read THEN it is an error', () => {
      const rule = 'storybook/no-stories-of';
      const entry = ruleAt(storybook, 'src/a.stories.tsx', rule);

      expect(entry).toBe('error');
    });
  });

  describe('GIVEN the Storybook main file', () => {
    it.each(['.storybook/main.ts', '.storybook/main.js'])(
      'WHEN no-uninstalled-addons is read for %s THEN it is an error with the default options',
      (file) => {
        const rule = 'storybook/no-uninstalled-addons';
        const entry = ruleAt(storybook, file, rule);

        expect(entry).toEqual([
          'error',
          { packageJsonLocation: '', ignore: [] }
        ]);
      }
    );
  });

  describe('GIVEN a plain TypeScript file', () => {
    it('WHEN it is composed after recommended THEN no-anonymous-default-export stays on', () => {
      const entry = ruleAt(composed, 'src/a.ts', ANONYMOUS_EXPORT);

      expect(entry).toBe('error');
    });

    it('WHEN a storybook rule is read THEN it is absent', () => {
      const entry = ruleAt(storybook, 'src/a.ts', 'storybook/no-stories-of');

      expect(entry).toBeUndefined();
    });
  });
});
