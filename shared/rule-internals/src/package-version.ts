import type { FileCacheIdentity } from './common/file-cache.type.ts';

declare const LINT_SUITE_PACKAGE_NAME: unknown;
declare const LINT_SUITE_PACKAGE_VERSION: unknown;

const SOURCE_PACKAGE_NAME = '@lint-suite/rule-internals';
const SOURCE_PACKAGE_VERSION = 'source';

const packageName =
  typeof LINT_SUITE_PACKAGE_NAME === 'string'
    ? LINT_SUITE_PACKAGE_NAME
    : SOURCE_PACKAGE_NAME;
const packageVersion =
  typeof LINT_SUITE_PACKAGE_VERSION === 'string'
    ? LINT_SUITE_PACKAGE_VERSION
    : SOURCE_PACKAGE_VERSION;

export const PACKAGE_IDENTITY: FileCacheIdentity = {
  packageName,
  packageVersion
};
