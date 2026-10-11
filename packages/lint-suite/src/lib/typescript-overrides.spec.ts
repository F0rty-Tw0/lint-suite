import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { javascript } from './javascript.ts';
import { ruleSeverity } from './test/utils/rule-severity.spec.util.ts';
import { typescriptOverrides } from './typescript-overrides.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [...javascript, ...typescriptOverrides]
});

describe('typescriptOverrides', () => {
  it('allows empty functions in JS test files', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.spec.js'
    )) as Linter.Config;

    expect(ruleSeverity(config, 'no-empty-function')).toBe(0);
  });
});
