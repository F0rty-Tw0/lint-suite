import { beforeAll, describe, expect, it } from 'vitest';

import {
  JS_PLUGIN_ERROR,
  ONE_LINE_GUARD_RULE,
  SMOKE_ACCEPTED_STATUSES,
  SMOKE_CONFIG,
  SMOKE_TRIGGERS,
  SMOKE_WORKSPACE,
  SUPPRESSED_GUARD_FILE
} from './test/common/smoke.const.ts';
import type {
  OxlintDiagnostic,
  OxlintRun,
  SmokeTrigger
} from './test/common/smoke.type.ts';
import fixtureConfig from './test/fixtures/workspace/oxlint.config.ts';
import { fixtureDirectory } from './test/utils/fixture-directory.spec.util.ts';
import {
  isReported,
  parseDiagnostics
} from './test/utils/oxlint-report.spec.util.ts';
import {
  parseRunOutput,
  runOxlint
} from './test/utils/oxlint-run.spec.util.ts';
import {
  parsePrintedConfig,
  printedConfigDiff
} from './test/utils/print-config.spec.util.ts';

describe('FEATURE: oxlint smoke run over the fixture workspace', () => {
  const workspace = fixtureDirectory(SMOKE_WORKSPACE);

  describe('GIVEN oxlint lints the workspace with every framework preset', () => {
    let run: OxlintRun;
    let diagnostics: OxlintDiagnostic[];

    beforeAll(() => {
      run = runOxlint(workspace, ['-c', SMOKE_CONFIG, '-f', 'json', '.']);
      diagnostics = parseRunOutput(run, parseDiagnostics);
    });

    it('WHEN the run ends THEN the exit status is 0 or 1', () => {
      expect(SMOKE_ACCEPTED_STATUSES).toContain(run.status);
    });

    it('WHEN the diagnostics are read THEN no JS plugin crashed', () => {
      const isCrash = (diagnostic: OxlintDiagnostic): boolean => {
        return diagnostic.message.includes(JS_PLUGIN_ERROR);
      };
      const crashes = diagnostics.filter(isCrash);

      expect(crashes).toEqual([]);
    });

    it.each(SMOKE_TRIGGERS)(
      'WHEN $file is linted THEN $rule is reported',
      (trigger: SmokeTrigger) => {
        const reported = isReported(diagnostics, trigger);

        expect(reported).toBe(true);
      }
    );

    it('WHEN the same violation follows eslint-disable-next-line THEN local/one-line-guard does not report it', () => {
      const trigger: SmokeTrigger = {
        rule: ONE_LINE_GUARD_RULE,
        file: SUPPRESSED_GUARD_FILE
      };

      const reported = isReported(diagnostics, trigger);

      expect(reported).toBe(false);
    });
  });

  describe('GIVEN oxlint prints the resolved workspace config', () => {
    it('WHEN native top-level rules and plugins are compared THEN they match the resolver', () => {
      const run = runOxlint(workspace, ['-c', SMOKE_CONFIG, '--print-config']);
      const printed = parseRunOutput(run, parsePrintedConfig);

      const diffs = printedConfigDiff(printed, fixtureConfig);

      expect(diffs).toEqual([]);
    });
  });
});
