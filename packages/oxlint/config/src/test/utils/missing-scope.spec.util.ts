import type { MissingTable } from '../common/missing.type.ts';

export const appliesToSample = (
  missing: MissingTable,
  rule: string,
  sample: string
): boolean => {
  const scope = missing.scopes.get(rule);

  if (scope === undefined) return true;

  return sample.endsWith(scope);
};
