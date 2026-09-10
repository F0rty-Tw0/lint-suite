import type { FileCacheIdentity } from './common/file-cache.type.ts';

declare const __LINT_SUITE_PACKAGE_NAME__: unknown;
declare const __LINT_SUITE_PACKAGE_VERSION__: unknown;

const SOURCE_PACKAGE_NAME = '@lint-suite/rule-internals';
const SOURCE_PACKAGE_VERSION = 'source';

const packageName =
  typeof __LINT_SUITE_PACKAGE_NAME__ === 'string'
    ? __LINT_SUITE_PACKAGE_NAME__
    : SOURCE_PACKAGE_NAME;
const packageVersion =
  typeof __LINT_SUITE_PACKAGE_VERSION__ === 'string'
    ? __LINT_SUITE_PACKAGE_VERSION__
    : SOURCE_PACKAGE_VERSION;

export const PACKAGE_IDENTITY: FileCacheIdentity = {
  packageName,
  packageVersion
};
