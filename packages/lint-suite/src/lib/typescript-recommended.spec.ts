import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { ruleSeverity } from './test/utils/rule-severity.spec.util.ts';
import { typescriptRecommended } from './typescript-recommended.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: typescriptRecommended
});

describe('typescriptRecommended', () => {
  it('applies typescript-eslint eslint-recommended after js recommended', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;

    expect(ruleSeverity(config, 'no-undef')).toBe(0);
  });
  it('applies nx rule overrides after the recommended configs', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;

    expect(ruleSeverity(config, '@typescript-eslint/no-explicit-any')).toBe(1);
  });
  it('roots the TS parser at the working directory', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;
    const parserOptions = { tsconfigRootDir: process.cwd() };

    expect(config.languageOptions).toMatchObject({ parserOptions });
  });
});
