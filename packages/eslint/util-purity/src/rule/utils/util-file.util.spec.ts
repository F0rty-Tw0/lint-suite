import assert from 'node:assert/strict';

import { describe, test } from 'vitest';

import { isProductionUtilFile } from './util-file.util.ts';

describe('FEATURE: isProductionUtilFile', () => {
  describe('GIVEN a util file outside test folders', () => {
    test('WHEN the path uses forward slashes THEN returns true', () => {
      const isUtil = isProductionUtilFile('/p/feature/utils/a.util.ts');

      assert.equal(isUtil, true);
    });

    test('WHEN the path uses backslashes THEN returns true', () => {
      const isUtil = isProductionUtilFile('C:\\p\\utils\\a.util.ts');

      assert.equal(isUtil, true);
    });
  });

  describe('GIVEN a util file under a test folder', () => {
    test('WHEN the folder is test THEN returns false', () => {
      const isUtil = isProductionUtilFile('/p/test/utils/a.spec.util.ts');

      assert.equal(isUtil, false);
    });

    test('WHEN the folder is testing THEN returns false', () => {
      const isUtil = isProductionUtilFile('/p/testing/utils/a.util.ts');

      assert.equal(isUtil, false);
    });
  });

  describe('GIVEN a file that is not a util', () => {
    test('WHEN it sits outside utils THEN returns false', () => {
      const isUtil = isProductionUtilFile('/p/feature/a.util.ts');

      assert.equal(isUtil, false);
    });

    test('WHEN it lacks the util suffix THEN returns false', () => {
      const isUtil = isProductionUtilFile('/p/feature/utils/a.ts');

      assert.equal(isUtil, false);
    });
  });
});
