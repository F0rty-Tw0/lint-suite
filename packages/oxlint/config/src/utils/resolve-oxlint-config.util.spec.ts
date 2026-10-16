import type { OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import {
  assertNoExcludeFiles,
  lintsFile,
  orderedOverrides,
  resolveOxlintConfig,
  topLevelRules
} from './resolve-oxlint-config.util.ts';

const NO_CONSOLE = 'eslint/no-console';
const SPEC_GLOB = ['**/*.spec.ts'];
const TS_GLOB = ['**/*.ts'];

const errorRules: OxlintOverride['rules'] = { [NO_CONSOLE]: 'error' };
const offRules: OxlintOverride['rules'] = { [NO_CONSOLE]: 'off' };
const warnRules: OxlintOverride['rules'] = { [NO_CONSOLE]: 'warn' };

const specOffOverride: OxlintOverride = { files: SPEC_GLOB, rules: offRules };
const tsWarnOverride: OxlintOverride = { files: TS_GLOB, rules: warnRules };
const srcSpecOffOverride: OxlintOverride = {
  files: ['src/*.spec.ts'],
  rules: offRules
};
const specErrorOverride: OxlintOverride = {
  files: SPEC_GLOB,
  rules: errorRules
};

const specOffConfig: OxlintConfig = { overrides: [specOffOverride] };
const errorConfig: OxlintConfig = { rules: errorRules };
const offConfig: OxlintConfig = { rules: offRules };

const reactVersion = { version: '18.2.0' };
const nextRoot = { rootDir: 'apps/web' };
const reactSettings = { react: reactVersion };
const nextSettings = { next: nextRoot };
const windowGlobals: OxlintOverride['globals'] = { window: 'readonly' };
const documentGlobals: OxlintOverride['globals'] = { document: 'readonly' };
const processGlobals: OxlintOverride['globals'] = { process: 'readonly' };

const GLOB_DEPTH_CASES: [string, string, string][] = [
  ['*.ts', 'a.ts', 'error'],
  ['*.ts', 'src/b.ts', 'error'],
  ['*.ts', 'src/x/c.ts', 'error'],
  ['src/*.ts', 'src/b.ts', 'error'],
  ['src/*.ts', 'src/x/c.ts', 'off'],
  ['src/**/*.ts', 'src/b.ts', 'error'],
  ['src/**/*.ts', 'src/x/c.ts', 'error'],
  ['src/**/*.ts', 'a.ts', 'off'],
  ['x/*.ts', 'src/x/c.ts', 'off'],
  ['**/*.ts', '.storybook/main.ts', 'error'],
  ['.storybook/main.{js,ts}', '.storybook/main.ts', 'error']
];

const EMPTY_RESOLVED = {
  rules: {},
  plugins: [],
  jsPlugins: [],
  settings: {},
  globals: {}
};

const ruleOf = (config: OxlintConfig, filePath: string): unknown => {
  const resolved = resolveOxlintConfig(config, filePath);

  return resolved.rules[NO_CONSOLE];
};

describe('FEATURE: resolve oxlint config', () => {
  describe('GIVEN a file path', () => {
    it.each([
      'a.js',
      'a.jsx',
      'a.cjs',
      'a.mjs',
      'a.ts',
      'a.tsx',
      'a.cts',
      'a.mts'
    ])('WHEN the file is %s THEN it is linted', (fileName) => {
      const linted = lintsFile(`src/${fileName}`);

      expect(linted).toBe(true);
    });

    it.each(['a.html', 'a.json', 'a.css', 'a'])(
      'WHEN the file is %s THEN it is not linted',
      (fileName) => {
        const linted = lintsFile(`src/${fileName}`);

        expect(linted).toBe(false);
      }
    );
  });

  describe('GIVEN extended configs with top-level rules', () => {
    it('WHEN a later extend turns a rule off THEN it beats an earlier error', () => {
      const root: OxlintConfig = { extends: [errorConfig, offConfig] };

      const rules = topLevelRules(root);

      expect(rules[NO_CONSOLE]).toBe('off');
    });

    it('WHEN the root sets its own rules THEN they beat every extend', () => {
      const root: OxlintConfig = {
        extends: [errorConfig, offConfig],
        rules: warnRules
      };

      const rules = topLevelRules(root);

      expect(rules[NO_CONSOLE]).toBe('warn');
    });

    it('WHEN an extend itself extends another THEN the inner rules come first', () => {
      const inner: OxlintConfig = { rules: errorRules };
      const middle: OxlintConfig = { extends: [inner], rules: offRules };
      const root: OxlintConfig = { extends: [middle] };

      const rules = topLevelRules(root);

      expect(rules[NO_CONSOLE]).toBe('off');
    });

    it('WHEN no config sets rules THEN the result is empty', () => {
      const rules = topLevelRules({});

      expect(rules).toEqual({});
    });
  });

  describe('GIVEN overrides spread across extends', () => {
    it('WHEN the tree is walked THEN extended overrides come before the own ones', () => {
      const extended: OxlintConfig = { overrides: [specOffOverride] };
      const own: OxlintConfig = {
        extends: [extended],
        overrides: [tsWarnOverride]
      };

      const overrides = orderedOverrides(own);

      expect(overrides).toEqual([specOffOverride, tsWarnOverride]);
    });

    it('WHEN no config has overrides THEN the list is empty', () => {
      const overrides = orderedOverrides({});

      expect(overrides).toEqual([]);
    });
  });

  describe('GIVEN an override in the first extend and a top-level rule in the second', () => {
    const root: OxlintConfig = { extends: [specOffConfig, errorConfig] };

    it('WHEN the file matches the override THEN the override beats the top-level rule', () => {
      const rule = ruleOf(root, 'src/a.spec.ts');

      expect(rule).toBe('off');
    });

    it('WHEN the file misses the override THEN the top-level rule stays', () => {
      const rule = ruleOf(root, 'src/a.ts');

      expect(rule).toBe('error');
    });
  });

  describe('GIVEN two overrides matching the same file', () => {
    it('WHEN both set the rule THEN the later one wins', () => {
      const root: OxlintConfig = {
        overrides: [tsWarnOverride, specOffOverride]
      };

      const rule = ruleOf(root, 'src/a.spec.ts');

      expect(rule).toBe('off');
    });

    it('WHEN their order is swapped THEN the other one wins', () => {
      const root: OxlintConfig = {
        overrides: [specOffOverride, tsWarnOverride]
      };

      const rule = ruleOf(root, 'src/a.spec.ts');

      expect(rule).toBe('warn');
    });

    it('WHEN an own override follows an extended one THEN the own one wins', () => {
      const root: OxlintConfig = {
        extends: [specOffConfig],
        overrides: [specErrorOverride]
      };

      const rule = ruleOf(root, 'src/a.spec.ts');

      expect(rule).toBe('error');
    });
  });

  describe('GIVEN settings and globals in extends and root', () => {
    const extendedOverride: OxlintOverride = {
      files: TS_GLOB,
      globals: documentGlobals
    };
    const extended: OxlintConfig = {
      settings: reactSettings,
      globals: windowGlobals,
      overrides: [extendedOverride]
    };
    const root: OxlintConfig = {
      extends: [extended],
      settings: nextSettings,
      globals: processGlobals
    };

    it('WHEN settings are resolved THEN only the root ones are kept', () => {
      const resolved = resolveOxlintConfig(root, 'src/a.ts');

      expect(resolved.settings).toEqual(nextSettings);
    });

    it('WHEN globals are resolved THEN root globals and extended override globals are kept', () => {
      const resolved = resolveOxlintConfig(root, 'src/a.ts');

      expect(resolved.globals).toEqual({
        process: 'readonly',
        document: 'readonly'
      });
    });

    it('WHEN the override misses the file THEN its globals are dropped', () => {
      const resolved = resolveOxlintConfig(root, 'src/a.js');

      expect(resolved.globals).toEqual(processGlobals);
    });
  });

  describe('GIVEN plugins and jsPlugins across the tree', () => {
    const rxjsPlugin = { name: 'rxjs', specifier: '/abs/rxjs.js' };
    const localPlugin = { name: 'local', specifier: '/abs/local.js' };
    const extendedOverride: OxlintOverride = {
      files: SPEC_GLOB,
      plugins: ['vitest'],
      jsPlugins: [rxjsPlugin]
    };
    const extended: OxlintConfig = {
      plugins: ['import'],
      jsPlugins: ['plain-plugin'],
      overrides: [extendedOverride]
    };
    const root: OxlintConfig = {
      extends: [extended],
      plugins: ['import', 'jsdoc'],
      jsPlugins: [localPlugin]
    };

    it('WHEN the file misses the override THEN only tree-level plugins are unioned', () => {
      const resolved = resolveOxlintConfig(root, 'src/a.ts');

      expect(resolved.plugins).toEqual(['import', 'jsdoc']);
    });

    it('WHEN the file misses the override THEN only tree-level JS plugins are unioned', () => {
      const resolved = resolveOxlintConfig(root, 'src/a.ts');

      expect(resolved.jsPlugins).toEqual(['plain-plugin', 'local']);
    });

    it('WHEN the file matches the override THEN its plugins join the union', () => {
      const resolved = resolveOxlintConfig(root, 'src/a.spec.ts');

      expect(resolved.plugins).toEqual(['import', 'jsdoc', 'vitest']);
    });

    it('WHEN the file matches the override THEN its JS plugins join the union', () => {
      const resolved = resolveOxlintConfig(root, 'src/a.spec.ts');

      expect(resolved.jsPlugins).toEqual(['plain-plugin', 'local', 'rxjs']);
    });
  });

  describe('GIVEN glob depth semantics probed on oxlint 1.88', () => {
    const rootOf = (pattern: string): OxlintConfig => {
      const override: OxlintOverride = { files: [pattern], rules: errorRules };

      const root: OxlintConfig = { rules: offRules, overrides: [override] };

      return root;
    };

    it.each(GLOB_DEPTH_CASES)(
      'WHEN the override pattern is %s and the file is %s THEN the rule is %s',
      (pattern, filePath, severity) => {
        const root = rootOf(pattern);

        const rule = ruleOf(root, filePath);

        expect(rule).toBe(severity);
      }
    );
  });

  describe('GIVEN a file oxlint never lints', () => {
    const root: OxlintConfig = {
      plugins: ['import'],
      jsPlugins: ['plain-plugin'],
      rules: errorRules,
      settings: nextSettings,
      globals: processGlobals
    };

    it.each(['src/a.html', 'src/a.json'])(
      'WHEN the path is %s THEN everything is empty',
      (filePath) => {
        const resolved = resolveOxlintConfig(root, filePath);

        expect(resolved).toEqual(EMPTY_RESOLVED);
      }
    );
  });

  describe('GIVEN a windows-style path', () => {
    const srcSpecConfig: OxlintConfig = { overrides: [srcSpecOffOverride] };
    const root: OxlintConfig = { extends: [srcSpecConfig, errorConfig] };

    it('WHEN backslashes separate segments THEN the override matching the posix path applies', () => {
      const rule = ruleOf(root, 'src\\a.spec.ts');

      expect(rule).toBe('off');
    });

    it('WHEN backslashes separate segments of a path outside the override THEN the top-level rule stays', () => {
      const rule = ruleOf(root, 'lib\\a.spec.ts');

      expect(rule).toBe('error');
    });
  });

  describe('GIVEN an override with excludeFiles', () => {
    const excluding: OxlintOverride = {
      files: TS_GLOB,
      excludeFiles: SPEC_GLOB,
      rules: offRules
    };

    it('WHEN it sits in the root THEN resolving throws', () => {
      const root: OxlintConfig = { overrides: [excluding] };
      const resolve = (): unknown => resolveOxlintConfig(root, 'src/a.ts');

      expect(resolve).toThrow('excludeFiles is not supported');
    });

    it('WHEN the override list holds it THEN the assertion throws', () => {
      const assert = (): void => assertNoExcludeFiles([excluding]);

      expect(assert).toThrow('excludeFiles is not supported');
    });

    it('WHEN the override list lacks it THEN the assertion passes', () => {
      const assert = (): void => assertNoExcludeFiles([specOffOverride]);

      expect(assert).not.toThrow();
    });

    it('WHEN it sits in an extend THEN resolving throws', () => {
      const extended: OxlintConfig = { overrides: [excluding] };
      const root: OxlintConfig = { extends: [extended] };
      const resolve = (): unknown => resolveOxlintConfig(root, 'src/a.ts');

      expect(resolve).toThrow('excludeFiles is not supported');
    });
  });
});
