import type { DummyRuleMap, OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import { defineLintSuiteConfig } from './define-lint-suite-config.util.ts';
import { orderedOverrides } from './resolve-oxlint-config.util.ts';

const ELEMENTS = 'boundaries/elements';
const NO_CONSOLE = 'eslint/no-console';

const leafSettings = { [ELEMENTS]: [1] };
const userSettings = { [ELEMENTS]: [2] };
const userGlobals: OxlintConfig['globals'] = { foo: 'readonly' };
const userEnv = { browser: true };
const consoleError: DummyRuleMap = { [NO_CONSOLE]: 'error' };
const consoleOff: DummyRuleMap = { [NO_CONSOLE]: 'off' };
const nestedLeaf: OxlintConfig = { settings: leafSettings };
const nestedMiddle: OxlintConfig = { extends: [nestedLeaf] };
const userConfig: OxlintConfig = {
  globals: userGlobals,
  env: userEnv,
  settings: userSettings
};
const ours: OxlintOverride = { files: ['**/*.ts'], rules: consoleError };
const theirs: OxlintOverride = { files: ['**/*.ts'], rules: consoleOff };
const userWithOverrides: OxlintConfig = {
  extends: [nestedLeaf],
  overrides: [theirs]
};
const presetWithOverrides: OxlintConfig = { overrides: [ours] };
const composedWithOverrides = defineLintSuiteConfig(
  presetWithOverrides,
  userWithOverrides
);
const composedWithUser = defineLintSuiteConfig(nestedMiddle, userConfig);

describe('FEATURE: define lint suite config', () => {
  describe('GIVEN oxlint configs', () => {
    it('WHEN a config nested two levels deep sets settings THEN they are hoisted to the root', () => {
      const result = defineLintSuiteConfig(nestedMiddle);

      expect(result.settings).toEqual(leafSettings);
    });

    it('WHEN the last config sets the same setting THEN it wins', () => {
      const settings = composedWithUser.settings;

      expect(settings).toEqual(userSettings);
    });

    it('WHEN the last config sets globals THEN they are hoisted', () => {
      const globals = composedWithUser.globals;

      expect(globals).toEqual({ foo: 'readonly' });
    });

    it('WHEN the last config sets env THEN it is hoisted', () => {
      const env = composedWithUser.env;

      expect(env).toEqual({ browser: true });
    });

    it('WHEN a config extends another THEN the extended settings merge before its own keys', () => {
      const parentSettings = { a: 1, b: 1 };
      const ownSettings = { b: 2 };
      const parent: OxlintConfig = { settings: parentSettings };
      const config: OxlintConfig = { extends: [parent], settings: ownSettings };

      const result = defineLintSuiteConfig(config);

      expect(result.settings).toEqual({ a: 1, b: 2 });
    });

    it('WHEN configs set ignorePatterns THEN they are concatenated in order', () => {
      const first: OxlintConfig = { ignorePatterns: ['a'] };
      const parent: OxlintConfig = { ignorePatterns: ['b'] };
      const second: OxlintConfig = { extends: [parent], ignorePatterns: ['c'] };

      const result = defineLintSuiteConfig(first, second);

      expect(result.ignorePatterns).toEqual(['a', 'b', 'c']);
    });

    it('WHEN no config sets root-only fields THEN only extends is returned', () => {
      const rulesOnly: OxlintConfig = { rules: {} };

      const result = defineLintSuiteConfig(rulesOnly);
      const keys = Object.keys(result);

      expect(keys).toEqual(['extends']);
    });

    it('WHEN a user config has its own extends and overrides THEN its settings are hoisted', () => {
      const settings = composedWithOverrides.settings;

      expect(settings).toEqual({ [ELEMENTS]: [1] });
    });

    it('WHEN a user config has its own extends and overrides THEN the root extends the preset then the user config', () => {
      const parts = composedWithOverrides.extends;

      expect(parts).toEqual([presetWithOverrides, userWithOverrides]);
    });

    it('WHEN a user config has its own extends and overrides THEN its overrides stay after ours', () => {
      const overrides = orderedOverrides(composedWithOverrides);

      expect(overrides).toEqual([ours, theirs]);
    });
  });
});
