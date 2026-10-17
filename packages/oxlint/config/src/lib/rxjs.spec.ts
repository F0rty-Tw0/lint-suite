import { describe, expect, it } from 'vitest';

import { rxjs } from './rxjs.ts';
import { fileUrlFlags } from '../test/utils/preset.spec.util.ts';
import { resolveOxlintConfig } from '../utils/resolve-oxlint-config.util.ts';

describe('FEATURE: rxjs', () => {
  describe('GIVEN the config', () => {
    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = rxjs.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });

    it('WHEN its JS plugin specifiers are read THEN the plugin is a file URL', () => {
      const flags = fileUrlFlags(rxjs);

      expect(flags).toEqual([true]);
    });

    it('WHEN its rules are read THEN only the five type-free ones are set', () => {
      const rules = rxjs.rules ?? {};
      const names = Object.keys(rules);

      expect(names).toEqual([
        '@smarttools/rxjs/no-ignored-replay-buffer',
        '@smarttools/rxjs/no-ignored-takewhile-value',
        '@smarttools/rxjs/no-index',
        '@smarttools/rxjs/no-internal',
        '@smarttools/rxjs/no-sharereplay'
      ]);
    });
  });

  describe('GIVEN a TypeScript or JavaScript file', () => {
    it.each(['src/a.ts', 'src/a.js'])(
      'WHEN %s is resolved THEN no-sharereplay allows config',
      (file) => {
        const resolved = resolveOxlintConfig(rxjs, file);
        const entry = resolved.rules['@smarttools/rxjs/no-sharereplay'];

        expect(entry).toEqual(['error', { allowConfig: true }]);
      }
    );
  });
});
