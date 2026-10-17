import type { MissingTable } from '../common/missing.type.ts';

export const duplicateCauseDiff = (missing: MissingTable): string[] => {
  const diffs: string[] = [];

  for (const [rule, headings] of missing.duplicates) {
    const listed = headings.join('; ');

    diffs.push(`[MISSING.md] ${rule}: duplicate cause (${listed})`);
  }

  return diffs;
};

export const deviationCauseDiff = (missing: MissingTable): string[] => {
  const diffs: string[] = [];

  for (const rule of missing.deviations) {
    const cause = missing.causes.get(rule);
    const reason = `duplicate cause (option deviation also under "${cause}")`;

    if (cause !== undefined) {
      diffs.push(`[MISSING.md] ${rule}: ${reason}`);
    }
  }

  return diffs;
};

export const staleRowDiff = (
  missing: MissingTable,
  eslintEnabled: ReadonlySet<string>
): string[] => {
  const causeRules = missing.causes.keys();
  const listed = [...causeRules, ...missing.deviations];
  const isStale = (rule: string): boolean => !eslintEnabled.has(rule);
  const stale = listed.filter(isStale);

  return stale.map(
    (rule) => `[MISSING.md] ${rule}: stale (ESLint never enables it)`
  );
};
