// TS anchor: without an entry whose `files` matches x.ts, calculateConfigForFile('x.ts') returns undefined,
// and a leaked file-less entry would be invisible.
import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { javascript } from './javascript.ts';
import { ruleSeverity } from './test/utils/rule-severity.spec.util.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [...javascript, { files: ['**/*.ts'] }]
});

const globalNames = (config: Linter.Config): string[] => {
  const globals = config.languageOptions?.['globals'] ?? {};

  return Object.keys(globals);
};

describe('javascript', () => {
  it('keeps typescript-eslint eslint-recommended overrides on JS files', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.js'
    )) as Linter.Config;

    expect(ruleSeverity(config, 'no-undef')).toBe(0);
    expect(ruleSeverity(config, 'no-dupe-keys')).toBe(0);
  });
  it('applies nx rule overrides after the recommended configs on JS files', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.js'
    )) as Linter.Config;

    expect(ruleSeverity(config, '@typescript-eslint/no-explicit-any')).toBe(1);
    expect(ruleSeverity(config, '@typescript-eslint/no-require-imports')).toBe(
      0
    );
  });
  it('keeps JS language options off TS files', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;

    expect(globalNames(config)).not.toContain('window');
  });
  it('keeps every rule off TS files', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;

    expect(config.rules ?? {}).toEqual({});
  });
});
