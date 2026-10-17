const UTIL_FILE = /\/utils\/[^/]+\.util\.ts$/;

const TEST_SEGMENT = '/test/';

const TESTING_SEGMENT = '/testing/';

export const isProductionUtilFile = (filename: string): boolean => {
  const posixPath = filename.replaceAll('\\', '/');
  const isUtilPath = UTIL_FILE.test(posixPath);

  if (!isUtilPath) return false;

  const isUnderTest =
    posixPath.includes(TEST_SEGMENT) || posixPath.includes(TESTING_SEGMENT);

  return !isUnderTest;
};
