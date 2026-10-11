import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import type { Dirent } from 'node:fs';

import type { FixtureWorkspace } from '../common/fixture-workspace.type.ts';

const FIXTURE_INFIX = '.fixture.';

const fixtureDirectory = (name: string): string => {
  return join(import.meta.dirname, '..', 'fixtures', name);
};

const isFixtureFile = (entry: Dirent): boolean => {
  return entry.isFile() && entry.name.includes(FIXTURE_INFIX);
};

const dropFixtureInfix = (entry: Dirent): void => {
  const source = join(entry.parentPath, entry.name);
  const name = entry.name.replace(FIXTURE_INFIX, '.');
  const target = join(entry.parentPath, name);

  renameSync(source, target);
};

const workspaceIn = (directory: string): FixtureWorkspace => {
  const workspace: FixtureWorkspace = {
    directory,
    file: (path: string): string => join(directory, path),
    dispose: (): void => {
      rmSync(directory, { force: true, recursive: true });
    }
  };

  return workspace;
};

const temporaryDirectory = (prefix: string): string => {
  return mkdtempSync(join(tmpdir(), prefix));
};

/** Copies `test/fixtures/<name>` to a temp dir and renames `x.fixture.ext` to `x.ext`. */
export const copyFixtureWorkspace = (name: string): FixtureWorkspace => {
  const directory = temporaryDirectory(`lint-suite-${name}-`);

  cpSync(fixtureDirectory(name), directory, { recursive: true });

  const entries = readdirSync(directory, {
    recursive: true,
    withFileTypes: true
  });
  const fixtureFiles = entries.filter(isFixtureFile);

  for (const entry of fixtureFiles) dropFixtureInfix(entry);

  return workspaceIn(directory);
};

/** Writes `files` (relative path → text) into a fresh temp dir. */
export const writeTempWorkspace = (
  files: Record<string, string>
): FixtureWorkspace => {
  const directory = temporaryDirectory('lint-suite-modular-boundaries-');

  for (const [path, text] of Object.entries(files)) {
    const file = join(directory, path);

    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }

  return workspaceIn(directory);
};
