import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import plugin from '../index.ts';

const rule = plugin.rules?.['type-placement'];

assert.ok(rule);

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const orderTypeData = { name: 'Order' };
const typeOutsideTypeFileError: RuleTester.TestCaseError = {
  messageId: 'typeOutsideTypeFile',
  data: orderTypeData
};

const valueInTypeFileError: RuleTester.TestCaseError = {
  messageId: 'valueInTypeFile'
};

const nonConstInConstFileError: RuleTester.TestCaseError = {
  messageId: 'nonConstInConstFile'
};

const relativeSourceData = { source: './order.ts' };
const relativeTypeImportError: RuleTester.TestCaseError = {
  messageId: 'typeImportNotFromTypeFile',
  data: relativeSourceData
};

const aliasSourceData = { source: '@shared/x' };
const aliasTypeImportError: RuleTester.TestCaseError = {
  messageId: 'typeImportNotFromTypeFile',
  data: aliasSourceData
};

const commonModuleSourceData = { source: './common/order.ts' };
const commonModuleTypeImportError: RuleTester.TestCaseError = {
  messageId: 'typeImportNotFromTypeFile',
  data: commonModuleSourceData
};

const aliasOptions = [{ internalPatterns: ['^@shared/'] }];

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a type-only import from a workspace alias by default',
    filename: '/p/feature/order.ts',
    code: `import type { X } from '@shared/x';`
  },
  {
    name: 'ignores a spec file exporting an interface',
    filename: '/p/feature/order.spec.ts',
    code: `export interface Order {}`
  },
  {
    name: 'ignores a stub file exporting an interface',
    filename: '/p/feature/test/stubs/order.stub.ts',
    code: `export interface Order {}`
  },
  {
    name: 'ignores a declaration file exporting an interface',
    filename: '/p/feature/order.d.ts',
    code: `export interface Order {}`
  },
  {
    name: 'ignores a state.type.ts file outside common',
    filename: '/p/feature/+state/user.state.type.ts',
    code: `export type UserState = { readonly id: string };`
  },
  {
    name: 'ignores a schema file exporting an inferred type beside its schema',
    filename: '/p/feature/common/history.schema.ts',
    code: `export const historyIdSchema = z.string(); export type HistoryId = z.infer<typeof historyIdSchema>;`
  },
  {
    name: 'ignores a schema file outside common exporting a const and a type',
    filename: '/p/feature/history.schema.ts',
    code: `export const historySchema = z.object({}); export type History = z.infer<typeof historySchema>;`
  },
  {
    name: 'ignores a file under a fixtures folder',
    filename: '/p/feature/fixtures/order.ts',
    code: `export interface Order {}`
  },
  {
    name: 'accepts a type exported from a common type file',
    filename: '/p/feature/common/order.type.ts',
    code: `export type Order = { readonly id: string };`
  },
  {
    name: 'accepts an exported type in test/common/x.type.ts',
    filename: '/p/feature/test/common/order.type.ts',
    code: `export type Order = { readonly id: string };`
  },
  {
    name: 'accepts a const-only export from a const file',
    filename: '/p/feature/order.const.ts',
    code: `export const LIMIT = 10;`
  },
  {
    name: 'accepts a relative type-only import from a type file, filename normalised from backslashes',
    filename: 'C:\\p\\feature\\order.ts',
    code: `import type { Order } from './common/order.type.ts';`
  },
  {
    name: 'accepts a type-only import from a bare package specifier',
    filename: '/p/feature/order.ts',
    code: `import type { Signal } from '@angular/core';`
  },
  {
    name: 'ignores a non type-only relative import',
    filename: '/p/feature/order.ts',
    code: `import { Order } from './order.ts';`
  },
  {
    name: 'accepts a type-only import from a schema file',
    filename: '/p/feature/order.ts',
    code: `import type { HistoryId } from './common/history.schema.ts';`
  },
  {
    name: 'accepts a type-only import from a sibling common barrel',
    filename: '/p/feature/order.ts',
    code: `import type { Order } from '../common';`
  },
  {
    name: 'accepts a type-only import from a common barrel index file',
    filename: '/p/feature/order.ts',
    code: `import type { Order } from './common/index.ts';`
  },
  {
    name: 'accepts a type-only import from an internal alias common barrel',
    filename: '/p/feature/order.ts',
    code: `import type { Order } from '@shared/common';`,
    options: aliasOptions
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a type exported outside a type file',
    filename: '/p/feature/order.ts',
    code: `export interface Order {}`,
    errors: [typeOutsideTypeFileError]
  },
  {
    name: 'reports a type file that is not under common',
    filename: '/p/feature/order.type.ts',
    code: `export type Order = { readonly id: string };`,
    errors: [typeOutsideTypeFileError]
  },
  {
    name: 'reports an exported type from a test/utils/x.spec.util.ts',
    filename: '/p/feature/test/utils/order.spec.util.ts',
    code: `export type Order = { readonly id: string };`,
    errors: [typeOutsideTypeFileError]
  },
  {
    name: 'reports a value export inside a type file',
    filename: '/p/feature/common/order.type.ts',
    code: `export const notAType = 1;`,
    errors: [valueInTypeFileError]
  },
  {
    name: 'reports a non-const export inside a const file',
    filename: '/p/feature/order.const.ts',
    code: `export function foo() {}`,
    errors: [nonConstInConstFileError]
  },
  {
    name: 'reports a relative type-only import not from a type file',
    filename: '/p/feature/order.ts',
    code: `import type { Order } from './order.ts';`,
    errors: [relativeTypeImportError]
  },
  {
    name: 'reports a type-only import from an alias listed in internalPatterns',
    filename: '/p/feature/order.ts',
    code: `import type { X } from '@shared/x';`,
    options: aliasOptions,
    errors: [aliasTypeImportError]
  },
  {
    name: 'reports a type-only import from a non-type module inside common',
    filename: '/p/feature/order.ts',
    code: `import type { Order } from './common/order.ts';`,
    errors: [commonModuleTypeImportError]
  }
];

ruleTester.run('type-placement/type-placement', rule, { valid, invalid });
