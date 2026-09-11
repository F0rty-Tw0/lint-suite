# @lint-suite/eslint-plugin-no-grouped-condition

This ESLint rule for TypeScript prevents mixed `&&` and `||` groups from obscuring an `if` decision or a `const` condition. Use it to give a meaningful name to the grouped part of a complex logical expression.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-no-grouped-condition eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-no-grouped-condition';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'no-grouped-condition': plugin },
    rules: { 'no-grouped-condition/no-grouped-condition': 'error' }
  }
];
```

## Options

This rule has no options.

## Examples

Each snippet is checked by `no-grouped-condition` alone with its default configuration.

### Valid examples

#### 1. Keep an all-AND condition flat

```ts
if (isReady && hasAccess && isVisible) {}
```

All logical operators are the same.

#### 2. Keep an all-OR condition flat

```ts
if (isAdmin || isOwner || isSupport) {}
```

An ungrouped same-operator sequence is allowed.

#### 3. Nest the same operator

```ts
if ((isReady && hasAccess) && isVisible) {}
```

Same-operator nesting is not reported.

#### 4. Name the mixed group first

```ts
const isPrivileged = isAdmin || isOwner;
if (isReady && isPrivileged) {}
```

The mixed decision is split into named values.

#### 5. Use a grouped condition in a `while`

```ts
while (isReady && (isAdmin || isOwner)) {}
```

The rule checks `if` tests and `const` initializers, not `while` tests.

### Invalid examples

#### 1. Group OR inside AND

<!-- prettier-ignore -->
```ts
if (isReady && (isAdmin || isOwner)) {}
```

The nested `||` differs from its enclosing `&&`.

#### 2. Group OR before AND

<!-- prettier-ignore -->
```ts
if ((isAdmin || isOwner) && isReady) {}
```

The leading group also mixes operators.

#### 3. Group AND inside OR

<!-- prettier-ignore -->
```ts
if (isAdmin || (isReady && hasAccess)) {}
```

The nested `&&` differs from its enclosing `||`.

#### 4. Store an AND-with-OR expression in a const

<!-- prettier-ignore -->
```ts
const canPublish = isReady && (isAdmin || isOwner);
```

Mixed groups in `const` initializers are reported.

#### 5. Store an OR-with-AND expression in a const

<!-- prettier-ignore -->
```ts
const canPublish = isAdmin || (isReady && hasAccess);
```

The grouped AND should be extracted into a named constant.

The rule reports a logical expression nested directly in another logical expression when their operators differ. It offers a suggestion to hoist the nested group into `const isGroup`. It only reports an `if` test or a `const` initializer whose complete initializer is the outer logical expression.
