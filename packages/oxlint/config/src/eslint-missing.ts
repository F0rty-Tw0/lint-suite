import * as lintSuite from 'lint-suite/eslint';
import type { OxlintConfig } from 'oxlint';

import { oxlintOverlap } from './eslint.ts';
import {
  angular as oxlintAngular,
  playwright as oxlintPlaywright,
  recommended as oxlintRecommended,
  rxjs as oxlintRxjs,
  storybook as oxlintStorybook,
  vitest as oxlintVitest
} from './index.ts';
import { defineLintSuiteConfig } from './utils/define-lint-suite-config.util.ts';

type LintSuitePreset = typeof lintSuite.recommended;

const mirror = (
  preset: LintSuitePreset,
  oxlint: OxlintConfig
): LintSuitePreset => {
  const config = defineLintSuiteConfig(oxlint);
  const overlap = oxlintOverlap(config);
  const mirrored = [...preset, ...overlap];

  return mirrored;
};

export const recommended: LintSuitePreset = mirror(
  lintSuite.recommended,
  oxlintRecommended
);

export const angular: LintSuitePreset = mirror(
  lintSuite.angular,
  oxlintAngular
);

export const rxjs: LintSuitePreset = mirror(lintSuite.rxjs, oxlintRxjs);

export const storybook: LintSuitePreset = mirror(
  lintSuite.storybook,
  oxlintStorybook
);

export const vitest: LintSuitePreset = mirror(lintSuite.vitest, oxlintVitest);

export const playwright: LintSuitePreset = mirror(
  lintSuite.playwright,
  oxlintPlaywright
);

export const angularTemplate: LintSuitePreset = lintSuite.angularTemplate;

export const json: LintSuitePreset = lintSuite.json;

export const prettier: LintSuitePreset = lintSuite.prettier;
