import { describe, expect, it } from 'vitest';

import { toOxlintGlobals } from './oxlint-globals.util.ts';

describe('FEATURE: toOxlintGlobals', () => {
  describe('GIVEN a writable flag', () => {
    it('WHEN it is mapped THEN it becomes writable', () => {
      const mapped = toOxlintGlobals({ process: true });

      expect(mapped).toEqual({ process: 'writable' });
    });
  });

  describe('GIVEN a read-only flag', () => {
    it('WHEN it is mapped THEN it becomes readonly', () => {
      const mapped = toOxlintGlobals({ window: false });

      expect(mapped).toEqual({ window: 'readonly' });
    });
  });

  describe('GIVEN no flags', () => {
    it('WHEN they are mapped THEN the result is empty', () => {
      const mapped = toOxlintGlobals({});

      expect(mapped).toEqual({});
    });
  });
});
