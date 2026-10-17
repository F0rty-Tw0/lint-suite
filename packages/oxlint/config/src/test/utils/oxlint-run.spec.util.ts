import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { OxlintRun } from '../common/smoke.type.ts';

const NODE_OPTIONS_ENV = 'NODE_OPTIONS';

export const runOxlint = (cwd: string, args: string[]): OxlintRun => {
  const manifestUrl = import.meta.resolve('oxlint/package.json');
  const manifestPath = fileURLToPath(manifestUrl);
  const bin = join(dirname(manifestPath), 'bin', 'oxlint');
  const env = {
    ...process.env,
    [NODE_OPTIONS_ENV]: '--conditions=development'
  };
  const options = { cwd, env, encoding: 'utf8' } as const;
  const result = spawnSync(process.execPath, [bin, ...args], options);
  const status = result.status ?? -1;
  const { stdout, stderr } = result;
  const run: OxlintRun = { status, stdout, stderr };

  if (result.error !== undefined) {
    throw new Error(`oxlint did not run: ${stderr}`, { cause: result.error });
  }

  return run;
};

export const parseRunOutput = <Parsed>(
  run: OxlintRun,
  parse: (stdout: string) => Parsed
): Parsed => {
  try {
    return parse(run.stdout);
  } catch (error) {
    throw new Error(`oxlint output did not parse: ${run.stderr}`, {
      cause: error
    });
  }
};
