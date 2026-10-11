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
  it('reports core bug rules on JS files', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.js'
    )) as Linter.Config;

    expect(ruleSeverity(config, 'no-undef')).toBe(2);
    expect(ruleSeverity(config, 'no-dupe-keys')).toBe(2);
    expect(ruleSeverity(config, 'prefer-spread')).toBe(2);
  });
  it.each([
    'no-unused-expressions',
    'no-array-constructor',
    'no-empty-function',
    'prefer-rest-params',
    'prefer-spread',
    'no-var',
    'prefer-const'
  ])('errors on %s in JS files', async (ruleId) => {
    const config = (await eslint.calculateConfigForFile(
      'x.js'
    )) as Linter.Config;

    expect(ruleSeverity(config, ruleId)).toBe(2);
  });
  it('parses JS files with an ecmaVersion newer than 2020', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.js'
    )) as Linter.Config;
    const ecmaVersion = config.languageOptions?.['ecmaVersion'];

    expect(ecmaVersion).toBeGreaterThan(2020);
  });
  it('configures no typescript-eslint rules on JS files', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.js'
    )) as Linter.Config;
    const ruleIds = Object.keys(config.rules ?? {});

    expect(
      ruleIds.filter((ruleId) => ruleId.startsWith('@typescript-eslint/'))
    ).toEqual([]);
  });
  it('knows browser and node globals on JS files', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.js'
    )) as Linter.Config;

    expect(globalNames(config)).toEqual(
      expect.arrayContaining(['window', 'process'])
    );
  });
  it('parses .cjs files as CommonJS', async () => {
    const config = (await eslint.calculateConfigForFile(
      'x.cjs'
    )) as Linter.Config;

    expect(config.languageOptions).toMatchObject({ sourceType: 'commonjs' });
  });
  it('scopes .cjs top-level declarations to the module', async () => {
    const source =
      "const crypto = require('crypto');\nconst status = 1;\nmodule.exports = { crypto, status };\n";

    const [result] = await eslint.lintText(source, { filePath: 'x.cjs' });

    expect(result?.messages).toEqual([]);
  });
  it('reports undeclared identifiers in .cjs files', async () => {
    const [result] = await eslint.lintText('module.exports = missing;\n', {
      filePath: 'x.cjs'
    });
    const ruleIds = result?.messages.map((message) => message.ruleId);

    expect(ruleIds).toEqual(['no-undef']);
  });
  it('runs file-less typescript-eslint rules on JS files', async () => {
    const withConsumerRule = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        ...javascript,
        { rules: { '@typescript-eslint/naming-convention': 'error' } }
      ]
    });
    const [result] = await withConsumerRule.lintText(
      'export const Bad_Name = 1;\n',
      { filePath: 'x.js' }
    );
    const ruleIds = result?.messages.map((message) => message.ruleId);

    expect(ruleIds).toContain('@typescript-eslint/naming-convention');
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
