import { describe, expect, it } from 'vitest';

import { isIgnoredPath, toEslintIgnores } from './ignore-patterns.util.ts';

const PATTERNS: string[] = ['gen', '/dist/', 'src/**', '!src/keep.ts'];

describe('FEATURE: ignore patterns, probed with gitignore semantics on oxlint 1.88', () => {
  describe('GIVEN oxlint ignore patterns', () => {
    it.each<[string, string[]]>([
      ['gen', ['**/gen', '**/gen/**']],
      ['gen/', ['**/gen', '**/gen/**']],
      ['/gen', ['gen', 'gen/**']],
      ['x/gen', ['x/gen', 'x/gen/**']],
      ['*.gen.ts', ['**/*.gen.ts', '**/*.gen.ts/**']],
      ['!src/keep.ts', ['!src/keep.ts', '!src/keep.ts/**']]
    ])(
      'WHEN %s becomes ESLint ignores THEN they are %j',
      (pattern, expected) => {
        const ignores = toEslintIgnores([pattern]);

        expect(ignores).toEqual(expected);
      }
    );
  });

  describe('GIVEN gen, /dist/, src/** and !src/keep.ts', () => {
    it.each([
      ['gen/a.ts', true],
      ['x/gen/a.ts', true],
      ['dist/a.ts', true],
      ['x/dist/a.ts', false],
      ['src/a.ts', true],
      ['src/keep.ts', false],
      ['lib/a.ts', false]
    ])('WHEN %s is checked THEN ignored is %s', (posixPath, expected) => {
      const isIgnored = isIgnoredPath(PATTERNS, posixPath);

      expect(isIgnored).toBe(expected);
    });
  });
});
