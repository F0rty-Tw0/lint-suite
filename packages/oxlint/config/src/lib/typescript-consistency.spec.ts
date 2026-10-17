import { describe, expect, it } from 'vitest';

import { typescriptConsistency } from './typescript-consistency.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

const IMPORT_STYLE = [
  'error',
  { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
];

describe('FEATURE: typescriptConsistency', () => {
  describe('GIVEN a TypeScript file', () => {
    it('WHEN typescript/consistent-type-definitions is read THEN it prefers type', () => {
      const rule = 'typescript/consistent-type-definitions';
      const entry = ruleAt(typescriptConsistency, 'src/a.ts', rule);

      expect(entry).toEqual(['error', 'type']);
    });

    it('WHEN typescript/consistent-type-imports is read THEN it separates type imports', () => {
      const rule = 'typescript/consistent-type-imports';
      const entry = ruleAt(typescriptConsistency, 'src/a.ts', rule);

      expect(entry).toEqual(IMPORT_STYLE);
    });
  });

  describe('GIVEN a TypeScript story file', () => {
    it('WHEN typescript/consistent-type-assertions is read THEN it is still on here', () => {
      const rule = 'typescript/consistent-type-assertions';
      const entry = ruleAt(typescriptConsistency, 'src/a.stories.ts', rule);

      expect(entry).toEqual(['error', { assertionStyle: 'never' }]);
    });
  });
});
