import type { OxlintConfig } from 'oxlint';
import type { CompatibleConfigArray } from 'typescript-eslint';

import type { MissingTable } from './missing.type.ts';
import type { ResolvedOxlintConfig } from '../../common/oxlint-config.type.ts';

export type EslintSampleConfig = {
  readonly rules: Readonly<Record<string, unknown>>;
  readonly settings: Readonly<Record<string, unknown>>;
  readonly globals: Readonly<Record<string, unknown>>;
};

export type ParityInput = {
  readonly pass: string;
  readonly sample: string;
  readonly eslint: EslintSampleConfig;
  readonly oxlint: ResolvedOxlintConfig;
  readonly missing: MissingTable;
  readonly typeAware: boolean;
};

export type ParityPass = {
  readonly title: string;
  readonly eslint: CompatibleConfigArray;
  readonly oxlint: OxlintConfig;
  readonly typeAware: boolean;
};
