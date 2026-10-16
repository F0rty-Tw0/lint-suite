import { describe, expect, it } from 'vitest';

import {
  oxlintFileGlobs,
  toEslintFiles,
  toOxlintScopedFiles
} from './eslint-files.util.ts';
import { OXLINT_GLOBS } from '../test/common/oxlint-globs.const.ts';

describe('FEATURE: toEslintFiles', () => {
  describe('GIVEN patterns', () => {
    it('WHEN a pattern has no slash THEN it matches at any depth', () => {
      const files = toEslintFiles(['*.ts', '*.spec.ts']);

      expect(files).toEqual(['**/*.ts', '**/*.spec.ts']);
    });

    it('WHEN a pattern has a slash THEN it is unchanged', () => {
      const files = toEslintFiles(['src/*.ts', '**/*.ts', 'apps/**/*.html']);

      expect(files).toEqual(['src/*.ts', '**/*.ts', 'apps/**/*.html']);
    });

    it('WHEN there are no patterns THEN the result is empty', () => {
      const files = toEslintFiles([]);

      expect(files).toEqual([]);
    });
  });
});

describe('FEATURE: oxlintFileGlobs', () => {
  describe('GIVEN the oxlint extensions', () => {
    it('WHEN they are read as globs THEN each matches its extension at any depth', () => {
      const globs = oxlintFileGlobs();

      expect(globs).toEqual(OXLINT_GLOBS);
    });
  });
});

describe('FEATURE: toOxlintScopedFiles', () => {
  describe('GIVEN override globs', () => {
    it.each(['**/*.ts', 'src/**/*.spec.ts', '**/*.mjs', 'a.cts'])(
      'WHEN %s already ends with an oxlint extension THEN it is unchanged',
      (glob) => {
        const files = toOxlintScopedFiles([glob]);

        expect(files).toEqual([glob]);
      }
    );

    it('WHEN a glob can match files oxlint never lints THEN it is paired with every oxlint extension glob', () => {
      const files = toOxlintScopedFiles(['scripts/**']);

      expect(files).toEqual([
        ['scripts/**', '**/*.js'],
        ['scripts/**', '**/*.jsx'],
        ['scripts/**', '**/*.cjs'],
        ['scripts/**', '**/*.mjs'],
        ['scripts/**', '**/*.ts'],
        ['scripts/**', '**/*.tsx'],
        ['scripts/**', '**/*.cts'],
        ['scripts/**', '**/*.mts']
      ]);
    });

    it.each(['**/*.json', 'src/*.{ts,html}', 'scripts/a.mjsx'])(
      'WHEN %s does not end with an oxlint extension THEN it is paired with every oxlint extension glob',
      (glob) => {
        const pairWith = (extensionGlob: string): string[] => {
          const pair = [glob, extensionGlob];

          return pair;
        };
        const expected = OXLINT_GLOBS.map(pairWith);

        const files = toOxlintScopedFiles([glob]);

        expect(files).toEqual(expected);
      }
    );
  });
});
