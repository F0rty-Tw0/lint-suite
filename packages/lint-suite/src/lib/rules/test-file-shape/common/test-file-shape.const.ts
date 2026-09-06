import type { ESLintUtils, TSESLint } from '@typescript-eslint/utils';

import type {
  ForbiddenShape,
  MessageIds,
  Options
} from './test-file-shape.type.ts';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Restrict test-support file shapes and enforce naming and typing on stub and mock exports'
};

const messages: Record<MessageIds, string> = {
  forbiddenTestFile:
    "Test-support file shape '{{ shape }}' is not allowed; test-only files live under test/stubs, test/mocks, test/fixtures, or test/utils.",
  stubName:
    "Stub export '{{ name }}' must be named in SCREAMING_SNAKE_CASE ending in '_STUB'.",
  stubType: "Stub export '{{ name }}' is missing an explicit type annotation.",
  mockName:
    "Mock export '{{ name }}' must be a camelCase name ending in 'Mock'.",
  mockFactory:
    "Mock export '{{ name }}' must be a function that returns fresh spies.",
  mockReturnType:
    "Mock export '{{ name }}' is missing an explicit return type."
};

export const meta: ESLintUtils.NamedCreateRuleMeta<
  MessageIds,
  unknown,
  Options
> = {
  type: 'problem',
  docs,
  schema: [],
  messages
};

export const defaultOptions: Options = [];

export const FORBIDDEN_SHAPES: ForbiddenShape[] = [
  { pattern: /\.spec-support\.ts$/, shape: '.spec-support.ts' },
  { pattern: /\.spec-helper\.ts$/, shape: '.spec-helper.ts' },
  { pattern: /\.test-utils\.ts$/, shape: '.test-utils.ts' },
  { pattern: /-fixture\.ts$/, shape: '-fixture.ts' },
  { pattern: /\/__mocks__\//, shape: '__mocks__/' },
  { pattern: /\/helpers\//, shape: 'helpers/' },
  { pattern: /\/common\/stubs\//, shape: 'common/stubs/' }
];

export const STUB_FILE_PATTERN = /\/test\/stubs\/.+\.stub\.ts$/;

export const MOCK_FILE_PATTERN = /\/test\/mocks\/.+\.mock\.ts$/;

export const SPEC_UTIL_FILE_PATTERN = /\/test\/utils\/.+\.spec\.util\.ts$/;

export const TESTING_LIB_SEGMENT = '/testing/';

export const TEST_FIXTURES_SEGMENT = '/test/fixtures/';

export const FIXTURES_SEGMENT = /\/fixtures\//;

export const STUB_NAME_PATTERN = /^[A-Z0-9]+(_[A-Z0-9]+)*_STUB$/;

export const MOCK_NAME_PATTERN = /^[a-z][A-Za-z0-9]*Mock$/;
