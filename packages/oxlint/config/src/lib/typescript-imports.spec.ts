import { describe, expect, it } from 'vitest';

import { typescriptImports } from './typescript-imports.ts';
import { ruleAt } from '../test/utils/preset.spec.util.ts';

describe('FEATURE: typescriptImports', () => {
  describe('GIVEN a TypeScript file', () => {
    it('WHEN import/no-duplicates is read THEN it is an error', () => {
      const rule = 'import/no-duplicates';
      const entry = ruleAt(typescriptImports, 'src/a.ts', rule);

      expect(entry).toBe('error');
    });

    it('WHEN import/no-cycle is read THEN it keeps the depth and external options', () => {
      const entry = ruleAt(typescriptImports, 'src/a.ts', 'import/no-cycle');

      expect(entry).toEqual([
        'error',
        {
          maxDepth: 2,
          ignoreExternal: true,
          allowUnsafeDynamicCyclicDependency: false
        }
      ]);
    });
  });

  describe('GIVEN a JavaScript file', () => {
    it('WHEN import/no-duplicates is read THEN it is absent', () => {
      const rule = 'import/no-duplicates';
      const entry = ruleAt(typescriptImports, 'src/a.js', rule);

      expect(entry).toBeUndefined();
    });
  });

  describe('GIVEN the config', () => {
    it('WHEN its plugins are read THEN import is native', () => {
      expect(typescriptImports.plugins).toEqual(['import']);
    });
  });
});
