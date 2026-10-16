import { describe, expect, it } from 'vitest';

import { base } from './base.ts';
import { boundaries } from './boundaries.ts';
import { javascript } from './javascript.ts';
import { recommended } from './recommended.ts';
import { typescript } from './typescript.ts';

describe('FEATURE: recommended', () => {
  describe('GIVEN the config', () => {
    it('WHEN its parts are read THEN they are base, javascript, typescript and boundaries', () => {
      const parts = [base, javascript, typescript, boundaries];

      expect(recommended.extends).toEqual(parts);
    });

    it('WHEN it is read THEN the default correctness set is off', () => {
      expect(recommended.categories).toEqual({ correctness: 'off' });
    });
  });
});
