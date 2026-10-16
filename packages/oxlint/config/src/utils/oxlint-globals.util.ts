import type { OxlintGlobals } from 'oxlint';

export const toOxlintGlobals = (
  flags: Readonly<Record<string, boolean>>
): OxlintGlobals => {
  const result: OxlintGlobals = {};

  for (const [name, flag] of Object.entries(flags)) {
    result[name] = flag ? 'writable' : 'readonly';
  }

  return result;
};
