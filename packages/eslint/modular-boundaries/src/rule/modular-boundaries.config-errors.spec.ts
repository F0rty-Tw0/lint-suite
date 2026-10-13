import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import type { Linter } from 'eslint';
import { afterAll, onTestFinished, test, vi } from 'vitest';

import {
  IMPORT_DATA,
  ONLY_UI_OPTIONS
} from './test/common/modular-boundaries.const.ts';
import { copyFixtureWorkspace } from './test/utils/fixture-workspace.spec.util.ts';
import { lintWithRule } from './test/utils/rule-under-test.spec.util.ts';

const broken = copyFixtureWorkspace('broken');

afterAll((): void => {
  broken.dispose();
});

const configErrorsOf = (
  messages: Linter.LintMessage[]
): Linter.LintMessage[] => {
  return messages.filter(
    (message) => message.messageId === 'workspaceConfigError'
  );
};

test('reports each workspace config error once on line 1 of a file with three imports', (): void => {
  const okFile = broken.file('packages/ok/src/a.ts');
  const code = readFileSync(okFile, 'utf8');
  const messages = lintWithRule(broken.directory, okFile, code);
  const configErrors = configErrorsOf(messages);
  const lines = messages.map((message) => message.line);
  const malformed = messages.find((message) =>
    message.message.includes('packages/bad/package.json:')
  );

  assert.equal(messages.length, 2);
  assert.equal(configErrors.length, 2);
  assert.deepEqual(lines, [1, 1]);
  assert.ok(malformed);
});

test('reports only config errors for a file outside every project', (): void => {
  const looseFile = broken.file('scripts/loose.ts');
  const code = readFileSync(looseFile, 'utf8');
  const messages = lintWithRule(
    broken.directory,
    looseFile,
    code,
    ONLY_UI_OPTIONS
  );
  const configErrors = configErrorsOf(messages);

  assert.equal(messages.length, 2);
  assert.equal(configErrors.length, 2);
});

// The cwd points at the broken workspace so a relative filename would land inside it: without the guard the
// rule would report its two config errors.
test('ignores a non-absolute filename', (): void => {
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(broken.directory);
  const options = { workspaceRoot: broken.directory };

  onTestFinished(() => cwd.mockRestore());

  const messages = lintWithRule(
    broken.directory,
    'packages/ok/src/a.ts',
    IMPORT_DATA,
    options
  );

  assert.deepEqual(messages, []);
});
