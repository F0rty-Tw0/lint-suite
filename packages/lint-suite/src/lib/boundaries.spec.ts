import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { ESLint } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';

import { boundaries } from './boundaries.ts';

const RULE_ID = 'modular-boundaries/modular-boundaries';

const workspaceEntry = (dependency: string): [string, string] => {
  return [dependency, 'workspace:*'];
};

const manifest = (
  name: string,
  tags: string[],
  dependencies: string[]
): string => {
  const entries = dependencies.map(workspaceEntry);
  const declared = Object.fromEntries(entries);
  const json = { name, tags, dependencies: declared };

  return JSON.stringify(json);
};

const files: Record<string, string> = {
  'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
  'packages/web/package.json': manifest('@ws/web', ['type:app'], ['@ws/ui']),
  'packages/admin/package.json': manifest(
    '@ws/admin',
    ['type:app'],
    ['@ws/web']
  ),
  'packages/ui/package.json': manifest('@ws/ui', ['type:lib'], ['@ws/web']),
  'packages/plain/package.json': manifest('@ws/plain', [], ['@ws/web'])
};

const workspace = mkdtempSync(join(tmpdir(), 'lint-suite-boundaries-'));

for (const [path, text] of Object.entries(files)) {
  const file = join(workspace, path);

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

const eslint = new ESLint({
  cwd: workspace,
  overrideConfigFile: true,
  overrideConfig: boundaries
});

const reportedIds = async (
  project: string,
  code: string
): Promise<(string | undefined)[]> => {
  const filePath = join(workspace, 'packages', project, 'index.js');
  const [result] = await eslint.lintText(code, { filePath });
  const messages = result?.messages ?? [];
  const ruleMessages = messages.filter((message) => message.ruleId === RULE_ID);

  return ruleMessages.map((message) => message.messageId);
};

afterAll(() => {
  rmSync(workspace, { force: true, recursive: true });
});

describe('boundaries', () => {
  it.each(['ui', 'admin'])(
    'reports a type:app import from %s',
    async (project) => {
      const ids = await reportedIds(project, "import '@ws/web';");

      expect(ids).toEqual(['notTagsConstraintViolation']);
    }
  );
  it('lets a type:app import a type:lib', async () => {
    const ids = await reportedIds('web', "import '@ws/ui';");

    expect(ids).toEqual([]);
  });
  it('lets an untagged project import a type:app', async () => {
    const ids = await reportedIds('plain', "import '@ws/web';");

    expect(ids).toEqual([]);
  });
});
