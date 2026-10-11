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
  it('errors on split overload signatures', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;

    expect(
      ruleSeverity(config, '@typescript-eslint/adjacent-overload-signatures')
    ).toBe(2);
  });
  it('leaves the deprecated no-empty-interface unset', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;

    expect(config.rules ?? {}).not.toHaveProperty(
      '@typescript-eslint/no-empty-interface'
    );
  });
  it('roots the TS parser at the working directory', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;
    const parserOptions = { tsconfigRootDir: process.cwd() };

    expect(config.languageOptions).toMatchObject({ parserOptions });
  });
  it('parses TS files with an ecmaVersion newer than 2020', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.ts'
    )) as Linter.Config;
    const ecmaVersion = config.languageOptions?.['ecmaVersion'];

    expect(ecmaVersion).toBeGreaterThan(2020);
  });
});
