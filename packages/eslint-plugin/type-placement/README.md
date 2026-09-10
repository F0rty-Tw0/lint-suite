# @lint-suite/eslint-plugin-type-placement

An ESLint rule for TypeScript and Angular-style feature code that enforces predictable locations for exported types, constants, and internal type-only imports. It keeps shared exported types in `common/*.type.ts`, limits `*.type.ts` and `*.const.ts` exports, and ensures internal `import type` declarations target type-oriented modules.

## Install

Requires Node.js 24+, ESLint `^10.9.1`, and TypeScript `>=6.0.3`.

```sh
pnpm add -D @lint-suite/eslint-plugin-type-placement eslint@^10.9.1 typescript@">=6.0.3" typescript-eslint
```

The plugin does not configure a TypeScript parser. Use `typescript-eslint` for TypeScript files:

```js
// eslint.config.js
import typePlacement from '@lint-suite/eslint-plugin-type-placement';
import tseslint from 'typescript-eslint';

export default [{
  files: ['**/*.ts'],
  languageOptions: { parser: tseslint.parser },
  plugins: { typePlacement },
  rules: { 'typePlacement/type-placement': 'error' }
}];
```

## Options

`internalPatterns` defaults to `[]`. Each supplied string becomes a regular expression. A matching non-relative `import type` source is treated as internal and must be a `*.type.ts`, `*.schema.ts`, or `common` barrel.

```js
rules: {
  'typePlacement/type-placement': ['error', {
    internalPatterns: ['^@workspace/']
  }]
}
```

This non-default option makes `@workspace/*` type-only imports subject to the internal-source restriction. Without it, non-relative package and workspace-alias imports are allowed.

## Filename rules and exemptions

Filename is part of this rule's contract. Exported type aliases and interfaces belong in `common/*.type.ts` or `test/common/*.type.ts`. A `*.type.ts` file may export only type aliases and interfaces; a `*.const.ts` file may export only `const` variable declarations.

Relative `import type` sources are internal. Their companion module must have a final filename segment ending in `.type.ts` or `.schema.ts`, unless the source is a `common` barrel such as `../common` or `./common/index.ts`. The same requirement applies to non-relative imports that match `internalPatterns`.

The rule does not inspect files ending in `.spec.ts`, `.stub.ts`, `.schema.ts`, or `.d.ts`; `state.type.ts` files; or files below a `/fixtures/` path. The exemption applies to the entire file.

## Examples

Each snippet below is checked by this rule alone, not by an entire ESLint configuration. Every example states its filename; import examples also state the required companion filename. The `internalPatterns` option is called out where it is non-default.

### Valid examples

#### 1. Exported type in a common type file

```ts
// Filename: src/orders/common/order.type.ts
export type Order = { readonly id: string };
```

#### 2. Exported interface in a test common type file

```ts
// Filename: src/orders/test/common/order.type.ts
export interface Order { readonly id: string }
```

#### 3. Const-only export in a const file

```ts
// Filename: src/orders/order.const.ts
export const PAGE_SIZE = 20;
```

#### 4. Relative type import from a type file

```ts
// Filename: src/orders/order.ts
// Companion file: src/orders/common/order.type.ts
import type { Order } from './common/order.type.ts';
```

#### 5. Relative type import from a common barrel

```ts
// Filename: src/orders/order.ts
// Companion barrel: src/orders/common/index.ts
import type { Order } from './common/index.ts';
```

#### 6. External alias import with default options

```ts
// Filename: src/orders/order.ts
import type { Signal } from '@angular/core';
```

This remains valid because `internalPatterns` defaults to `[]`.

### Invalid examples

#### 1. Exported type outside a common type file

```ts
// Filename: src/orders/order.ts
export interface Order {}
```

Move the type to `src/orders/common/order.type.ts`.

#### 2. Type file outside a common directory

```ts
// Filename: src/orders/order.type.ts
export type Order = { readonly id: string };
```

The `.type.ts` suffix alone is insufficient; the file must be under `common`.

#### 3. Value export in a common type file

```ts
// Filename: src/orders/common/order.type.ts
export const DEFAULT_ORDER = { id: 'new' };
```

`*.type.ts` files may export only type aliases and interfaces.

#### 4. Function export in a const file

```ts
// Filename: src/orders/order.const.ts
export function createOrder() {}
```

`*.const.ts` files may export only `const` variable declarations.

#### 5. Relative type import from a regular module

```ts
// Filename: src/orders/order.service.ts
// Companion file: src/orders/order.ts
import type { Order } from './order.ts';
```

The companion must instead be a `.type.ts`, `.schema.ts`, or `common` barrel module.

#### 6. Internal alias type import from a regular module

```ts
// Filename: src/orders/order.ts
// Non-default rule option: { internalPatterns: ['^@workspace/'] }
// Companion module: @workspace/orders
import type { Order } from '@workspace/orders';
```

Because the non-default option marks this alias as internal, its companion must be a type file, schema file, or `common` barrel.

The named `typePlacementRule` export is for composed plugin registries.
