import type { Linter } from 'eslint';

export const ruleSeverity = (
  config: Linter.Config,
  ruleId: string
): unknown => {
  const entry = config.rules?.[ruleId];

  return Array.isArray(entry) ? entry[0] : entry;
};
