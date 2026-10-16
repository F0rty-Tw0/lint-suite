import { describe, expect, it } from 'vitest';

import { appliesToSample } from './missing-scope.spec.util.ts';
import type { MissingTable } from '../common/missing.type.ts';
import { MISSING_TABLE_STUB } from '../stubs/missing.stub.ts';

const table: MissingTable = {
  ...MISSING_TABLE_STUB,
  causes: new Map([
    ['max-lines', 'Angular templates'],
    ['json/no-empty-keys', 'JSON']
  ]),
  scopes: new Map([['max-lines', '.html']])
};

describe('FEATURE: MISSING.md row scope', () => {
  describe('GIVEN a row scoped to .html', () => {
    it('WHEN the sample is an .html file THEN the row applies', () => {
      const applies = appliesToSample(table, 'max-lines', 'src/a.html');

      expect(applies).toBe(true);
    });

    it('WHEN the sample is a .ts file THEN the row does not apply', () => {
      const applies = appliesToSample(table, 'max-lines', 'src/a.ts');

      expect(applies).toBe(false);
    });
  });

  describe('GIVEN a row without a scope', () => {
    it('WHEN any sample is checked THEN the row applies', () => {
      const applies = appliesToSample(table, 'json/no-empty-keys', 'src/a.ts');

      expect(applies).toBe(true);
    });
  });
});
