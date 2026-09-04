import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type FixtureCase = {
  readonly code: string;
  readonly filename: string;
};

type FixtureProject = {
  readonly directory: string;
  readonly file: (name: string) => string;
  readonly dispose: () => void;
};

export const fixtureDirectory = (name: string): string => {
  return join(import.meta.dirname, '..', 'common', 'fixtures', name);
};

export const fixtureCase = (directory: string, file: string): FixtureCase => {
  const filename = join(directory, file);

  const testCase: FixtureCase = {
    code: readFileSync(filename, 'utf8'),
    filename
  };

  return testCase;
};

export const copyFixtureProject = (
  name: string,
  prefix = `lint-suite-${name}-`
): FixtureProject => {
  const directory = mkdtempSync(join(tmpdir(), prefix));

  cpSync(fixtureDirectory(name), directory, { recursive: true });

  const fixtureProject: FixtureProject = {
    directory,
    file: (file: string): string => join(directory, file),
    dispose: (): void => {
      rmSync(directory, { force: true, recursive: true });
    }
  };

  return fixtureProject;
};
