# @lint-suite/eslint-plugin-no-call-in-condition

This ESLint rule for TypeScript keeps `if` decisions readable by requiring non-predicate calls to be named before they participate in a condition. Use it when a validation, lookup, or calculation would otherwise be hidden inside control flow.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-no-call-in-condition eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below. It does not enable parser services; add your project service configuration only when you want TypeScript checker-based predicate detection.

```js
import plugin from '@lint-suite/eslint-plugin-no-call-in-condition';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'no-call-in-condition': plugin },
    rules: { 'no-call-in-condition/no-call-in-condition': 'error' }
  }
];
```

## Options

`allowPredicates` is an array of regular-expression sources and defaults to `["^(is|has)[A-Z]"]`. Without parser services, a call whose callee name matches an entry is exempt.

```js
rules: {
  'no-call-in-condition/no-call-in-condition': ['error', { allowPredicates: ['^can[A-Z]'] }]
}
```

A locally declared function with a TypeScript type-predicate return is always exempt. With parser services, the rule instead uses the TypeScript checker to exempt predicate call signatures. Zero-argument, non-computed `this.member()` calls are also exempt.

## Examples

Each snippet is checked by `no-call-in-condition` alone, using the default configuration unless noted otherwise.

### Valid examples

#### 1. Use a named validation result

```ts
const validationResult = validate(order);
if (validationResult) {}
```

The call already has a name before the `if`.

#### 2. Combine names and comparisons

```ts
if (isReady && count > 2) {}
```

No call expression decides this condition.

#### 3. Call a default-name predicate

```ts
if (isAvailable(item)) {}
```

`isAvailable` matches the default `allowPredicates` pattern.

#### 4. Read a zero-argument `this` member

```ts
class Panel {
  render() {
    if (this.loading()) return;
  }
}
```

Zero-argument, non-computed `this.member()` calls are exempt.

#### 5. Use a custom predicate-name pattern

```ts
if (canPublish(article)) {}
```

This is valid only with `allowPredicates: ['^can[A-Z]']`.

### Invalid examples

#### 1. Call directly in an `if`

<!-- prettier-ignore -->
```ts
if (validate(order)) {}
```

`validate` decides the condition without a named result.

#### 2. Negate a call in an `if`

<!-- prettier-ignore -->
```ts
if (!validate(order)) {}
```

Negation does not make the inline call acceptable.

#### 3. Join a call with another condition

<!-- prettier-ignore -->
```ts
if (isReady && validate(order)) {}
```

The non-exempt `validate` call is still part of the decision.

#### 4. Compare a call result inline

<!-- prettier-ignore -->
```ts
if (countLines(order) > 2) {}
```

Name the count before comparing it.

#### 5. Hide a call in a const-derived condition

<!-- prettier-ignore -->
```ts
const active = isReady && validate(order);
if (active) {}
```

The rule follows a directly referenced `const` initializer and reports `validate`.

The rule checks calls in `if` tests and in a non-call `const` initializer when that constant is referenced directly by an `if` test. It does not trace a bare call initializer, so `const result = validate(order); if (result) {}` is valid: the call result is already named. It does not inspect `while` conditions.
