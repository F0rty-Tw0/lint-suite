import { resolve } from 'node:path';

export const fixtureDirectory = (name: string): string => {
  return resolve(import.meta.dirname, '..', 'fixtures', name);
};
