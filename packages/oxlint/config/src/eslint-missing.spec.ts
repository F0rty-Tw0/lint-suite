import * as lintSuite from 'lint-suite/eslint';
import type { OxlintConfig } from 'oxlint';
import type { CompatibleConfigArray } from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import * as eslintMissing from './eslint-missing.ts';
import {
  angular,
  playwright,
  recommended,
  rxjs,
  storybook,
  vitest
} from './index.ts';
import { KEPT_SAMPLES, OVERLAP_SAMPLES } from './test/common/overlap.const.ts';
import type { ParityPass } from './test/common/parity.type.ts';
import {
  enabledInBoth,
  lostAgainstPlain
} from './test/utils/overlap.spec.util.ts';
import { parityPasses } from './test/utils/parity-passes.spec.util.ts';
import { defineLintSuiteConfig } from './utils/define-lint-suite-config.util.ts';

type MirroredPass = {
  readonly title: string;
  readonly plain: CompatibleConfigArray;
  readonly mirrored: CompatibleConfigArray;
  readonly oxlint: OxlintConfig;
};

const MIRRORED: Record<string, CompatibleConfigArray> = {
  'pass 1: recommended': [...eslintMissing.recommended],
  'pass 3: recommended + angular': [
    ...eslintMissing.recommended,
    ...eslintMissing.angular,
    ...eslintMissing.angularTemplate
  ],
  'pass 3: recommended + rxjs': [
    ...eslintMissing.recommended,
    ...eslintMissing.rxjs
  ],
  'pass 3: recommended + vitest': [
    ...eslintMissing.recommended,
    ...eslintMissing.vitest
  ],
  'pass 3: recommended + playwright': [
    ...eslintMissing.recommended,
    ...eslintMissing.playwright
  ],
  'pass 3: recommended + storybook': [
    ...eslintMissing.recommended,
    ...eslintMissing.storybook
  ]
};

const STACKED_PASS: MirroredPass = {
  title: 'stacked: every preset together',
  plain: [
    ...lintSuite.recommended,
    ...lintSuite.angular,
    ...lintSuite.rxjs,
    ...lintSuite.vitest,
    ...lintSuite.playwright,
    ...lintSuite.storybook,
    ...lintSuite.angularTemplate
  ],
  mirrored: [
    ...eslintMissing.recommended,
    ...eslintMissing.angular,
    ...eslintMissing.rxjs,
    ...eslintMissing.vitest,
    ...eslintMissing.playwright,
    ...eslintMissing.storybook,
    ...eslintMissing.angularTemplate
  ],
  oxlint: defineLintSuiteConfig(
    recommended,
    angular,
    rxjs,
    vitest,
    playwright,
    storybook
  )
};

const isPlainPass = (pass: ParityPass): boolean => {
  return !pass.typeAware;
};

const toTitle = (pass: ParityPass): string => {
  return pass.title;
};

const isUnmapped = (title: string): boolean => {
  return !(title in MIRRORED);
};

const toMirroredPass = (pass: ParityPass): MirroredPass => {
  const mirrored = MIRRORED[pass.title] ?? [];
  const mirroredPass: MirroredPass = {
    title: pass.title,
    plain: pass.eslint,
    mirrored,
    oxlint: pass.oxlint
  };

  return mirroredPass;
};

const plainPasses = parityPasses().filter(isPlainPass);

const plainMirroredPasses = plainPasses.map(toMirroredPass);

const MIRRORED_PASSES: MirroredPass[] = [...plainMirroredPasses, STACKED_PASS];

const PASS_THROUGH = [
  {
    name: 'angularTemplate',
    missing: eslintMissing.angularTemplate,
    plain: lintSuite.angularTemplate
  },
  { name: 'json', missing: eslintMissing.json, plain: lintSuite.json },
  {
    name: 'prettier',
    missing: eslintMissing.prettier,
    plain: lintSuite.prettier
  }
];

describe('FEATURE: eslint-missing presets', () => {
  describe('GIVEN the non-type-aware parity passes', () => {
    it('WHEN listing them THEN each has a mirrored config', () => {
      const titles = plainPasses.map(toTitle);

      const unmapped = titles.filter(isUnmapped);

      expect(unmapped).toEqual([]);
    });
  });

  describe('GIVEN each mirrored config paired with its oxlint config', () => {
    for (const pass of MIRRORED_PASSES) {
      describe(pass.title, () => {
        it('WHEN only the plain lint-suite config runs THEN src/a.ts has rules enabled in both tools', async () => {
          const both = await enabledInBoth(pass.plain, pass.oxlint, 'src/a.ts');

          expect(both.length).toBeGreaterThan(0);
        });

        it.each(OVERLAP_SAMPLES)(
          'WHEN the mirrored config runs THEN %s has no rule enabled in both tools',
          async (sample) => {
            const both = await enabledInBoth(
              pass.mirrored,
              pass.oxlint,
              sample
            );

            expect(both).toEqual([]);
          }
        );

        it.each(KEPT_SAMPLES)(
          'WHEN the mirrored config runs THEN every rule lint-suite enables on %s still runs in ESLint or oxlint',
          async (sample) => {
            const lost = await lostAgainstPlain(
              pass.plain,
              pass.mirrored,
              pass.oxlint,
              sample
            );

            expect(lost).toEqual([]);
          }
        );
      });
    }
  });

  describe('GIVEN the entry point', () => {
    it('WHEN listing exports THEN there are exactly the 9 presets', () => {
      const names = Object.keys(eslintMissing).sort();

      expect(names).toEqual([
        'angular',
        'angularTemplate',
        'json',
        'playwright',
        'prettier',
        'recommended',
        'rxjs',
        'storybook',
        'vitest'
      ]);
    });

    it.each(PASS_THROUGH)(
      'WHEN reading $name THEN it is the lint-suite array itself',
      ({ missing, plain }) => {
        expect(missing).toBe(plain);
      }
    );
  });
});
