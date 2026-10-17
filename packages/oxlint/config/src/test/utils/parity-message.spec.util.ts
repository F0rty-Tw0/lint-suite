import { isEnabled } from '../../utils/rule-name.util.ts';
import type { ParityInput } from '../common/parity.type.ts';

export const mismatch = (
  input: ParityInput,
  subject: string,
  reason: string
): string => {
  return `[${input.pass}] ${input.sample} ${subject}: ${reason}`;
};

export const enabledRules = (
  rules: Readonly<Record<string, unknown>>
): [string, unknown][] => {
  const entries = Object.entries(rules);

  return entries.filter(([, entry]) => isEnabled(entry));
};
