import type { DummyRuleMap, OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import {
  lintsFile,
  resolveOxlintConfig
} from './resolve-oxlint-config.util.ts';
import type { ResolvedOxlintConfig } from '../common/oxlint-config.type.ts';

const EMPTY_RESOLVED: ResolvedOxlintConfig = {
  rules: {},
  plugins: [],
  jsPlugins: [],
  settings: {},
  globals: {}
};

const aliasOffRules: DummyRuleMap = { 'typescript/default-param-last': 'off' };

const aliasOffOverride: OxlintOverride = {
  files: ['scripts/**'],
  rules: aliasOffRules
};

const rootRules: DummyRuleMap = {
  'eslint/default-param-last': 'error',
  'unicorn/no-null': 'error'
};

const root: OxlintConfig = {
  plugins: ['typescript'],
  ignorePatterns: ['generated/**'],
  rules: rootRules,
  overrides: [aliasOffOverride]
};

const bareOffRules: DummyRuleMap = { 'no-null': 'off' };

const bareOverride: OxlintOverride = {
  files: ['scripts/**'],
  rules: bareOffRules
};

const bareOverrideRoot: OxlintConfig = { overrides: [bareOverride] };

const scriptsPluginRules: DummyRuleMap = {
  'unicorn/no-null': 'error',
  'import/no-namespace': 'error',
  'import/no-self-import': 'error'
};

const scriptsPluginsOverride: OxlintOverride = {
  files: ['scripts/**'],
  plugins: ['unicorn', 'import'],
  rules: scriptsPluginRules
};

const noNullOff: DummyRuleMap = { 'unicorn/no-null': 'off' };

const oldScriptsOffOverride: OxlintOverride = {
  files: ['scripts/old/**'],
  rules: noNullOff
};

const overridePluginsRoot: OxlintConfig = {
  plugins: ['typescript'],
  overrides: [scriptsPluginsOverride, oldScriptsOffOverride]
};

const SCRIPTS_RULES: Record<string, unknown> = {
  'unicorn/no-null': 'error',
  'import/no-namespace': 'error'
};

describe('FEATURE: resolve oxlint config the way oxlint scopes rules', () => {
  describe('GIVEN file names oxlint 1.88 treats as minified when probed', () => {
    it.each(['a.min.js', 'a-min.ts', 'a_min.mts', 'a.min.spec.ts', '-min.cjs'])(
      'WHEN the file is %s THEN it is not linted',
      (fileName) => {
        const linted = lintsFile(`src/${fileName}`);

        expect(linted).toBe(false);
      }
    );

    it.each(['a.mini.js', 'a.MIN.js', 'min.js', 'b-min-c.ts', 'a.min/b.js'])(
      'WHEN the file is %s THEN it is linted',
      (fileName) => {
        const linted = lintsFile(`src/${fileName}`);

        expect(linted).toBe(true);
      }
    );
  });

  describe('GIVEN root ignorePatterns, an aliased override key and a rule of a plugin that is not enabled', () => {
    it('WHEN the file matches an ignore pattern THEN everything is empty', () => {
      const resolved = resolveOxlintConfig(root, 'generated/a.ts');

      expect(resolved).toEqual(EMPTY_RESOLVED);
    });

    it('WHEN the override matches THEN its aliased key turns the canonical rule off', () => {
      const resolved = resolveOxlintConfig(root, 'scripts/a.ts');

      expect(resolved.rules['eslint/default-param-last']).toBe('off');
    });

    it('WHEN the file is linted THEN the rule of the plugin that is not enabled is dropped', () => {
      const resolved = resolveOxlintConfig(root, 'src/a.ts');

      expect(resolved.rules).toEqual({ 'eslint/default-param-last': 'error' });
    });
  });

  describe('GIVEN an override that enables plugins the root does not, probed on oxlint 1.88', () => {
    it.each(['scripts/a.ts', 'scripts/old/a.ts'])(
      'WHEN %s is resolved THEN the override rules run except the module-graph rules and a later off without the plugin is dropped',
      (filePath) => {
        const resolved = resolveOxlintConfig(overridePluginsRoot, filePath);

        expect(resolved.rules).toEqual(SCRIPTS_RULES);
      }
    );
  });

  describe('GIVEN an override with a rule key without a plugin prefix', () => {
    it('WHEN a file it does not match is resolved THEN it still throws naming the key and its place', () => {
      const resolve = (): ResolvedOxlintConfig =>
        resolveOxlintConfig(bareOverrideRoot, 'src/a.ts');

      expect(resolve).toThrow("Bare rule name 'no-null' in overrides[0].rules");
    });
  });
});
