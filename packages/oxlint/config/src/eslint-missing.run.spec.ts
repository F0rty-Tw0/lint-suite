import * as lintSuite from 'lint-suite/eslint';
import type { CompatibleConfigArray } from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

import * as eslintMissing from './eslint-missing.ts';
import { NATIVE_ROWS } from './test/common/missing-run.const.ts';
import type { EslintRun } from './test/common/missing-run.type.ts';
import { SMOKE_CONFIG, SMOKE_WORKSPACE } from './test/common/smoke.const.ts';
import { fixtureDirectory } from './test/utils/fixture-directory.spec.util.ts';
import {
  oxlintRows,
  rowsInBoth,
  rowsUncovered,
  runEslint
} from './test/utils/missing-run.spec.util.ts';
import { parseDiagnostics } from './test/utils/oxlint-report.spec.util.ts';
import {
  parseRunOutput,
  runOxlint
} from './test/utils/oxlint-run.spec.util.ts';

const PLAIN: CompatibleConfigArray = [
  ...lintSuite.recommended,
  ...lintSuite.angular,
  ...lintSuite.rxjs,
  ...lintSuite.vitest,
  ...lintSuite.playwright,
  ...lintSuite.storybook,
  ...lintSuite.angularTemplate
];

const MIRRORED: CompatibleConfigArray = [
  ...eslintMissing.recommended,
  ...eslintMissing.angular,
  ...eslintMissing.rxjs,
  ...eslintMissing.vitest,
  ...eslintMissing.playwright,
  ...eslintMissing.storybook,
  ...eslintMissing.angularTemplate
];

describe('FEATURE: eslint-missing presets on a real run', () => {
  const workspace = fixtureDirectory(SMOKE_WORKSPACE);

  describe('GIVEN oxlint, plain lint-suite ESLint and mirrored ESLint lint the fixture workspace', () => {
    let oxlint: string[];
    let plain: EslintRun;
    let mirrored: EslintRun;

    beforeAll(async () => {
      const run = runOxlint(workspace, ['-c', SMOKE_CONFIG, '-f', 'json', '.']);
      const diagnostics = parseRunOutput(run, parseDiagnostics);

      oxlint = oxlintRows(diagnostics);
      plain = await runEslint(workspace, PLAIN);
      mirrored = await runEslint(workspace, MIRRORED);
    });

    it('WHEN both ESLint runs end THEN neither hit a fatal parse error', () => {
      expect(plain.fatals).toEqual([]);
      expect(mirrored.fatals).toEqual([]);
    });

    it('WHEN plain ESLint and oxlint report THEN they share rows, so the run is not vacuous', () => {
      const shared = rowsInBoth(plain.rows, oxlint);

      expect(shared.length).toBeGreaterThan(0);
    });

    it('WHEN oxlint reports THEN it includes native eslint, typescript and import rules', () => {
      expect(oxlint).toEqual(expect.arrayContaining(NATIVE_ROWS));
    });

    it('WHEN mirrored ESLint reports THEN it reports rows, so the run is not vacuous', () => {
      expect(mirrored.rows.length).toBeGreaterThan(0);
    });

    it('WHEN mirrored ESLint and oxlint report THEN no file and rule is in both', () => {
      const both = rowsInBoth(mirrored.rows, oxlint);

      expect(both).toEqual([]);
    });

    it('WHEN plain ESLint reports THEN mirrored ESLint or oxlint reports every file and rule', () => {
      const lost = rowsUncovered(plain.rows, [mirrored.rows, oxlint]);

      expect(lost).toEqual([]);
    });
  });
});
