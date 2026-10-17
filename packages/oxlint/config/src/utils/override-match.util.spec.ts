import type { OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import { matchesOverride, toPosixPath } from './override-match.util.ts';

const BARE_OVERRIDE: OxlintOverride = { files: ['*.ts'] };

const SLASHED_OVERRIDE: OxlintOverride = { files: ['src/*.ts'] };

const DOT_OVERRIDE: OxlintOverride = { files: ['**/*.ts'] };

describe('FEATURE: oxlint override file matching', () => {
  describe('GIVEN a bare pattern', () => {
    it.each([
      ['a.ts', true],
      ['src/x/b.ts', true],
      ['src/x/b.js', false]
    ])('WHEN %s is matched THEN the result is %s', (path, expected) => {
      const matches = matchesOverride(BARE_OVERRIDE, path);

      expect(matches).toBe(expected);
    });
  });

  describe('GIVEN a pattern with a slash', () => {
    it.each([
      ['src/a.ts', true],
      ['a.ts', false],
      ['src/x/b.ts', false]
    ])('WHEN %s is matched THEN the result is %s', (path, expected) => {
      const matches = matchesOverride(SLASHED_OVERRIDE, path);

      expect(matches).toBe(expected);
    });
  });

  describe('GIVEN a globstar pattern', () => {
    it('WHEN a path has a dot segment THEN it still matches', () => {
      const matches = matchesOverride(DOT_OVERRIDE, '.storybook/main.ts');

      expect(matches).toBe(true);
    });
  });

  describe('GIVEN a Windows path', () => {
    it('WHEN it is converted THEN backslashes become slashes', () => {
      const posixPath = toPosixPath('src\\x\\a.ts');

      expect(posixPath).toBe('src/x/a.ts');
    });
  });
});
