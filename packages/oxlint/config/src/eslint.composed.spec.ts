import { recommended as eslintRecommended } from 'lint-suite/eslint';
import type { DummyRuleMap, OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import { oxlintOverlap } from './eslint.ts';
import { angular } from './lib/angular.ts';
import { recommended } from './lib/recommended.ts';
import { PARITY_SAMPLES } from './test/common/parity.const.ts';
import type { ParityPass } from './test/common/parity.type.ts';
import { eslintConfigFor } from './test/utils/eslint-sample-config.spec.util.ts';
import {
  enabledAfterOverlap,
  enabledInBoth,
  lostAfterOverlap,
  overlapOffNames,
  resolvedEnabledNames
} from './test/utils/overlap.spec.util.ts';
import { parityPasses } from './test/utils/parity-passes.spec.util.ts';
import { defineLintSuiteConfig } from './utils/define-lint-suite-config.util.ts';
import { normalizeSeverity } from './utils/rule-name.util.ts';

const OVERLAP_SAMPLES: string[] = [...PARITY_SAMPLES, 'src/a.component.ts'];

const KEPT_SAMPLES: string[] = [
  ...OVERLAP_SAMPLES,
  'scripts/a.ts',
  'generated/a.ts'
];

const consoleOff: DummyRuleMap = { 'eslint/no-console': 'off' };

const scriptsConsoleOff: OxlintOverride = {
  files: ['scripts/**'],
  rules: consoleOff
};

const scriptsOverride: OxlintConfig = { overrides: [scriptsConsoleOff] };

const aliasOffRules: OxlintOverride['rules'] = {
  '@typescript-eslint/no-explicit-any': 'off',
  'import-x/no-self-import': 'off'
};

const scriptsAliasOff: OxlintOverride = {
  files: ['scripts/**'],
  rules: aliasOffRules
};

const scopedUserConfig: OxlintConfig = {
  ignorePatterns: ['generated/**'],
  overrides: [scriptsAliasOff]
};

const userOverridePass: ParityPass = {
  title: 'user: recommended + a scripts/** override turning no-console off',
  eslint: eslintRecommended,
  oxlint: defineLintSuiteConfig(recommended, scriptsOverride),
  typeAware: false
};

const scopedUserPass: ParityPass = {
  title:
    'user: recommended + ignorePatterns + aliased rule keys turned off for scripts',
  eslint: eslintRecommended,
  oxlint: defineLintSuiteConfig(recommended, scopedUserConfig),
  typeAware: false
};

const parityPassList = parityPasses();
const KEPT_PASSES: ParityPass[] = [
  ...parityPassList,
  userOverridePass,
  scopedUserPass
];

const ANGULAR_PASS_TITLE = 'pass 3: recommended + angular';

const isAngularPass = (pass: ParityPass): boolean => {
  return pass.title === ANGULAR_PASS_TITLE;
};

const angularPass = parityPassList.find(isAngularPass);

const angularEslint = angularPass?.eslint ?? [];

const maxLinesOff: DummyRuleMap = { 'eslint/max-lines': 'off' };

const maxLinesError: DummyRuleMap = { 'eslint/max-lines': 'error' };

const scriptsMaxLines: OxlintOverride = {
  files: ['scripts/**'],
  rules: maxLinesError
};

const scriptsOnlyMaxLines: OxlintConfig = {
  rules: maxLinesOff,
  overrides: [scriptsMaxLines]
};

const scriptsMaxLinesOxlint = defineLintSuiteConfig(
  recommended,
  angular,
  scriptsOnlyMaxLines
);

describe('FEATURE: oxlintOverlap over the composed lint-suite configs', () => {
  describe('GIVEN each composed lint-suite config', () => {
    for (const pass of parityPassList) {
      describe(pass.title, () => {
        it('WHEN it is overlapped THEN the rules turned off are exactly the ESLint names of the enabled oxlint rules', () => {
          const expected = resolvedEnabledNames(pass.oxlint, OVERLAP_SAMPLES);

          const actual = overlapOffNames(pass.oxlint);

          expect(actual).toEqual(expected);
        });

        it('WHEN nothing is appended THEN src/a.ts has rules enabled in both tools', async () => {
          const eslint = pass.eslint;
          const oxlint = pass.oxlint;

          const both = await enabledInBoth(eslint, oxlint, 'src/a.ts');

          expect(both.length).toBeGreaterThan(0);
        });

        it.each(OVERLAP_SAMPLES)(
          'WHEN the overlap is appended THEN %s has no rule enabled in both tools',
          async (sample) => {
            const eslint = pass.eslint;
            const oxlint = pass.oxlint;

            const both = await enabledAfterOverlap(eslint, oxlint, sample);

            expect(both).toEqual([]);
          }
        );
      });
    }
  });

  describe('GIVEN each composed config and a user override that turns a rule off', () => {
    for (const pass of KEPT_PASSES) {
      describe(pass.title, () => {
        it.each(KEPT_SAMPLES)(
          'WHEN the overlap is appended THEN every rule ESLint enables on %s still runs in ESLint or oxlint',
          async (sample) => {
            const eslint = pass.eslint;
            const oxlint = pass.oxlint;

            const lost = await lostAfterOverlap(eslint, oxlint, sample);

            expect(lost).toEqual([]);
          }
        );
      });
    }
  });

  describe('GIVEN the angular preset and a user override that enables max-lines only under scripts/**', () => {
    it('WHEN the overlap is appended THEN every rule ESLint enables on scripts/a.html still runs in ESLint or oxlint', async () => {
      const oxlint = scriptsMaxLinesOxlint;

      const lost = await lostAfterOverlap(
        angularEslint,
        oxlint,
        'scripts/a.html'
      );

      expect(lost).toEqual([]);
    });

    it('WHEN the overlap is appended THEN ESLint turns max-lines off on scripts/a.ts', async () => {
      const overlay = oxlintOverlap(scriptsMaxLinesOxlint);
      const combined = [...angularEslint, ...overlay];

      const sampleConfig = await eslintConfigFor(combined, 'scripts/a.ts');
      const severity = normalizeSeverity(sampleConfig.rules['max-lines']);

      expect(severity).toBe('off');
    });
  });
});
