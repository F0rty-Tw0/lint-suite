import type { Linter } from 'eslint';
import type { DummyRuleMap, OxlintConfig } from 'oxlint';

import { PARITY_SAMPLES } from './parity.const.ts';

const CONSOLE_RULES: Linter.RulesRecord = { 'no-console': 'error' };

export const CONSOLE_ON: Linter.Config = {
  files: ['**/*.ts'],
  rules: CONSOLE_RULES
};

const CONSOLE_OXLINT_RULES: DummyRuleMap = { 'eslint/no-console': 'error' };

export const CONSOLE_OXLINT: OxlintConfig = { rules: CONSOLE_OXLINT_RULES };

export const OVERLAP_SAMPLES: string[] = [
  ...PARITY_SAMPLES,
  'src/a.component.ts'
];

export const KEPT_SAMPLES: string[] = [
  ...OVERLAP_SAMPLES,
  'scripts/a.ts',
  'generated/a.ts',
  'vendor/a.min.js',
  'src/a-min.ts',
  'src/a_min.ts',
  'vendor/keep.min.js'
];
