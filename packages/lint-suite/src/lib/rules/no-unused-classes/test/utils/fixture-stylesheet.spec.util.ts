import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type FixtureCase = {
  readonly code: string;
  readonly codeFilename: string;
};

export const fixtureDirectory = (name: string): string => {
  return join(import.meta.dirname, '..', 'fixtures', name);
};

export const fixtureFile = (name: string, file: string): string => {
  return join(fixtureDirectory(name), file);
};

export const fixtureCase = (name: string, file: string): FixtureCase => {
  const codeFilename = fixtureFile(name, file);
  const code = readFileSync(codeFilename, 'utf8');
  const testCase: FixtureCase = { code, codeFilename };

  return testCase;
};
