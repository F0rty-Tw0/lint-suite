# @lint-suite/eslint-plugin-max-condition-operands

This ESLint rule for TypeScript limits the number of logical operands in an `if` condition. Use it to keep authorization, state, and eligibility decisions small enough to name or review easily.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-max-condition-operands eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-max-condition-operands';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'max-condition-operands': plugin },
    rules: { 'max-condition-operands/max-condition-operands': 'error' }
  }
];
```

## Options

`max` is the maximum number of operands in an `if` condition. It defaults to `3` and must be an integer of at least `1`.

```js
rules: {
  'max-condition-operands/max-condition-operands': ['error', { max: 2 }]
}
```

## Examples

Each snippet is checked by `max-condition-operands` alone, using the default `max: 3` unless noted otherwise.

### Valid examples

#### 1. Use one operand

```ts
if (isReady) {}
```

A non-logical condition counts as one operand.

#### 2. Use two operands

```ts
if (isReady && hasAccess) {}
```

Two operands are within the default maximum.

#### 3. Use three operands

```ts
if (isReady && hasAccess && isVisible) {}
```

Three is the default limit.

#### 4. Put a longer expression outside an `if`

```ts
const canPublish = isReady && hasAccess && isVisible && isCurrent;
```

Only `if` conditions are checked.

#### 5. Use four operands in a `while`

```ts
while (isReady && hasAccess && isVisible && isCurrent) {}
```

`while` conditions are outside this rule's scope.

### Invalid examples

#### 1. Use four AND operands

<!-- prettier-ignore -->
```ts
if (a && b && c && d) {}
```

Four operands exceed the default maximum of three.

#### 2. Use four OR operands

<!-- prettier-ignore -->
```ts
if (a || b || c || d) {}
```

Every logical leaf counts, regardless of the operator.

#### 3. Mix operators across four operands

<!-- prettier-ignore -->
```ts
if (a && b || c && d) {}
```

The recursively counted leaves total four.

#### 4. Add parentheses to four operands

<!-- prettier-ignore -->
```ts
if ((a && b) || (c && d)) {}
```

Parentheses do not reduce the operand count.

#### 5. Exceed a configured maximum

<!-- prettier-ignore -->
```ts
if (isReady && hasAccess && isVisible) {}
```

This is invalid only with `{ max: 2 }`, where three operands exceed the configured limit.

The rule counts logical-expression leaves recursively and checks only `if` conditions. A non-logical condition counts as one operand.
