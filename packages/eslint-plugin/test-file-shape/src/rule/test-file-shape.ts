import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  FIXTURES_SEGMENT,
  FORBIDDEN_SHAPES,
  MOCK_FILE_PATTERN,
  SPEC_UTIL_FILE_PATTERN,
  STUB_FILE_PATTERN,
  TESTING_LIB_SEGMENT,
  TEST_FIXTURES_SEGMENT,
  defaultOptions,
  meta
} from './common/test-file-shape.const.ts';
import type { MessageIds, Options } from './common/test-file-shape.type.ts';
import { isMockFile, mockExportListeners } from './mock-exports.ts';
import { isStubFile, stubExportListeners } from './stub-exports.ts';

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint-plugin/test-file-shape#readme'
);

const isUnderTestingLib = (filename: string): boolean =>
  filename.includes(TESTING_LIB_SEGMENT);

const misplacedFixtures = (filename: string): string | undefined => {
  const hasFixturesSegment = FIXTURES_SEGMENT.test(filename);

  if (!hasFixturesSegment) return undefined;

  const isTestFixtures = filename.includes(TEST_FIXTURES_SEGMENT);

  if (isTestFixtures) return undefined;

  return 'fixtures/ outside test/fixtures/';
};

const misplacedShape = (filename: string): string | undefined => {
  const isTestingLib = isUnderTestingLib(filename);

  if (isTestingLib) return undefined;

  const isStub = filename.endsWith('.stub.ts');
  const isPlacedStub = STUB_FILE_PATTERN.test(filename);

  if (isStub && !isPlacedStub) return '.stub.ts outside test/stubs/';

  const isMock = filename.endsWith('.mock.ts');
  const isPlacedMock = MOCK_FILE_PATTERN.test(filename);

  if (isMock && !isPlacedMock) return '.mock.ts outside test/mocks/';

  const isSpecUtil = filename.endsWith('.spec.util.ts');
  const isPlacedSpecUtil = SPEC_UTIL_FILE_PATTERN.test(filename);

  if (isSpecUtil && !isPlacedSpecUtil) {
    return '.spec.util.ts outside test/utils/';
  }

  return misplacedFixtures(filename);
};

const forbiddenShape = (filename: string): string | undefined => {
  const match = FORBIDDEN_SHAPES.find((entry) => entry.pattern.test(filename));

  if (match) return match.shape;

  return misplacedShape(filename);
};

const forbiddenTestFileListeners = (
  context: Readonly<TSESLint.RuleContext<MessageIds, Options>>,
  shape: string
): TSESLint.RuleListener => {
  const listeners: TSESLint.RuleListener = {
    Program(node): void {
      const data = { shape };
      const report: TSESLint.ReportDescriptor<MessageIds> = {
        node,
        messageId: 'forbiddenTestFile',
        data
      };

      context.report(report);
    }
  };

  return listeners;
};

export default createRule<Options, MessageIds>({
  name: 'test-file-shape',
  meta,
  defaultOptions,
  create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    const shape = forbiddenShape(filename);

    if (shape) return forbiddenTestFileListeners(context, shape);

    const isStub = isStubFile(filename);

    if (isStub) return stubExportListeners(context);

    const isMock = isMockFile(filename);

    if (isMock) return mockExportListeners(context);

    const noListeners: TSESLint.RuleListener = {};

    return noListeners;
  }
});
