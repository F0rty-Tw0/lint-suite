import { isEnabled, toEslintRuleNames } from './rule-name.util.ts';

export const enabledEslintNames = (
  rules: Readonly<Record<string, unknown>> | undefined
): string[] => {
  const entries = Object.entries(rules ?? {});
  const enabled = entries.filter(([, entry]) => isEnabled(entry));
  const names = enabled.flatMap(([name]) => toEslintRuleNames(name));
  const unique = new Set(names);

  return Array.from(unique);
};
