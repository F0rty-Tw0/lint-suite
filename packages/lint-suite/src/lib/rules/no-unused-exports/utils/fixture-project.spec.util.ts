import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type FixtureCase = {
  readonly code: string;
  readonly filename: string;
};

export const fixtureDirectory = (name: string): string => {
  return join(import.meta.dirname, '..', 'common', 'fixtures', name);
};

export const fixtureCase = (directory: string, file: string): FixtureCase => {
  const filename = join(directory, file);
  const code = readFileSync(filename, 'utf8');
  const testCase: FixtureCase = { code, filename };

  return testCase;
};
