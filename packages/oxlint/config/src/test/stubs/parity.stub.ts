import { MISSING_TABLE_STUB } from './missing.stub.ts';
import { RESOLVED_OXLINT_CONFIG_STUB } from './oxlint-config.stub.ts';
import type { EslintSampleConfig, ParityInput } from '../common/parity.type.ts';

export const ESLINT_SAMPLE_CONFIG_STUB: EslintSampleConfig = {
  rules: {},
  settings: {},
  globals: {}
};

export const PARITY_INPUT_STUB: ParityInput = {
  pass: 'pass',
  sample: 'src/a.ts',
  eslint: ESLINT_SAMPLE_CONFIG_STUB,
  oxlint: RESOLVED_OXLINT_CONFIG_STUB,
  missing: MISSING_TABLE_STUB,
  typeAware: false
};
