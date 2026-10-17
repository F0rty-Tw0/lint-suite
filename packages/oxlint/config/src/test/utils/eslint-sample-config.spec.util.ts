import { tmpdir } from 'node:os';

import { ESLint } from 'eslint';
import type { CompatibleConfigArray } from 'typescript-eslint';

import { enabledRules } from './parity-message.spec.util.ts';
import { isRecord } from './record.spec.util.ts';
import type { EslintSampleConfig, ParityPass } from '../common/parity.type.ts';

const EMPTY_RECORD: Readonly<Record<string, unknown>> = {};

const toRecord = (value: unknown): Readonly<Record<string, unknown>> => {
  if (!isRecord(value)) return EMPTY_RECORD;

  return value;
};

export const eslintConfigFor = async (
  config: CompatibleConfigArray,
  sample: string
): Promise<EslintSampleConfig> => {
  const eslint = new ESLint({
    cwd: tmpdir(),
    overrideConfigFile: true,
    overrideConfig: config
  });
  const calculated: unknown = await eslint.calculateConfigForFile(sample);
  const resolved = toRecord(calculated);
  const languageOptions = toRecord(resolved['languageOptions']);
  const rules = toRecord(resolved['rules']);
  const settings = toRecord(resolved['settings']);
  const globals = toRecord(languageOptions['globals']);
  const sampleConfig: EslintSampleConfig = { rules, settings, globals };

  return sampleConfig;
};

export const eslintEnabledAcross = async (
  passes: ParityPass[],
  samples: string[]
): Promise<Set<string>> => {
  const enabled = new Set<string>();

  for (const pass of passes) {
    for (const sample of samples) {
      const sampleConfig = await eslintConfigFor(pass.eslint, sample);
      const sampleRules = enabledRules(sampleConfig.rules);

      for (const [rule] of sampleRules) {
        enabled.add(rule);
      }
    }
  }

  return enabled;
};
