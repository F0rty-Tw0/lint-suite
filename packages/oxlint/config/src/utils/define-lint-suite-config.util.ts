import type { OxlintConfig } from 'oxlint';

import type { RootRecordPicker } from '../common/define-lint-suite-config.type.ts';

const collectIgnorePatterns = (config: OxlintConfig): string[] => {
  const extended = config.extends ?? [];
  const inherited = extended.flatMap(collectIgnorePatterns);
  const own = config.ignorePatterns ?? [];

  return [...inherited, ...own];
};

const collectRecord = <Value>(
  config: OxlintConfig,
  pick: RootRecordPicker<Value>
): Record<string, Value> => {
  const extended = config.extends ?? [];
  const merged: Record<string, Value> = {};

  for (const parent of extended) {
    const inherited = collectRecord(parent, pick);

    Object.assign(merged, inherited);
  }

  const own = pick(config);

  Object.assign(merged, own);

  return merged;
};

const nonEmpty = (record: Readonly<Record<string, unknown>>): boolean => {
  return Object.keys(record).length > 0;
};

export const defineLintSuiteConfig = (
  ...configs: OxlintConfig[]
): OxlintConfig => {
  const tree: OxlintConfig = { extends: [...configs] };
  const settings = collectRecord(tree, (config) => config.settings);
  const globals = collectRecord(tree, (config) => config.globals);
  const env = collectRecord(tree, (config) => config.env);
  const ignorePatterns = collectIgnorePatterns(tree);
  const result: OxlintConfig = { extends: [...configs] };

  const hasSettings = nonEmpty(settings);
  const hasGlobals = nonEmpty(globals);
  const hasEnv = nonEmpty(env);

  if (hasSettings) {
    result.settings = settings;
  }

  if (hasGlobals) {
    result.globals = globals;
  }

  if (hasEnv) {
    result.env = env;
  }

  if (ignorePatterns.length > 0) {
    result.ignorePatterns = ignorePatterns;
  }

  return result;
};
