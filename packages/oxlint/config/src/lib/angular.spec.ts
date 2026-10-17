import type { OxlintConfig } from 'oxlint';
import { describe, expect, it } from 'vitest';

import { angular } from './angular.ts';
import { fileUrlFlags, ruleAt } from '../test/utils/preset.spec.util.ts';
import { resolveOxlintConfig } from '../utils/resolve-oxlint-config.util.ts';

const UNSET_FIELDS: (keyof OxlintConfig)[] = ['rules', 'globals', 'settings'];

const TYPED_RULES: string[] = [
  '@angular-eslint/no-developer-preview',
  '@angular-eslint/no-experimental',
  '@angular-eslint/no-uncalled-signals',
  '@angular-eslint/reactive-context-must-read-signal'
];

describe('FEATURE: angular', () => {
  describe('GIVEN the config', () => {
    it('WHEN it is read THEN the default correctness set is off', () => {
      const categories = angular.categories;

      expect(categories).toEqual({ correctness: 'off' });
    });

    it('WHEN its JS plugin specifiers are read THEN both plugins are file URLs', () => {
      const flags = fileUrlFlags(angular);

      expect(flags).toEqual([true, true]);
    });

    it.each(UNSET_FIELDS)(
      'WHEN its top-level %s are read THEN none are set',
      (field) => {
        const value = angular[field];

        expect(value).toBeUndefined();
      }
    );
  });

  describe('GIVEN a TypeScript file', () => {
    it('WHEN no-unused-angular-fields is read THEN it uses local analysis', () => {
      const rule = 'lint-suite-angular/no-unused-angular-fields';
      const entry = ruleAt(angular, 'src/a.ts', rule);

      expect(entry).toEqual(['error', { analysis: 'local' }]);
    });

    it('WHEN prefer-on-push-component-change-detection is read THEN it allows explicit OnPush', () => {
      const rule = '@angular-eslint/prefer-on-push-component-change-detection';
      const entry = ruleAt(angular, 'src/a.ts', rule);

      expect(entry).toEqual(['error', { allowExplicitOnPush: true }]);
    });

    it.each(TYPED_RULES)('WHEN %s is read THEN it is absent', (rule) => {
      const entry = ruleAt(angular, 'src/a.ts', rule);

      expect(entry).toBeUndefined();
    });

    it('WHEN its globals are resolved THEN browser and node names are present', () => {
      const resolved = resolveOxlintConfig(angular, 'src/a.ts');

      expect(resolved.globals).toMatchObject({
        window: 'readonly',
        process: 'readonly'
      });
    });
  });

  describe('GIVEN a JavaScript file', () => {
    it('WHEN an angular rule is read THEN it is absent', () => {
      const rule = '@angular-eslint/prefer-inject';
      const entry = ruleAt(angular, 'src/a.js', rule);

      expect(entry).toBeUndefined();
    });
  });
});
