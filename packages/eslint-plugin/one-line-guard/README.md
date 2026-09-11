# @lint-suite/eslint-plugin-one-line-guard

This ESLint plugin keeps compact TypeScript and JavaScript guard clauses visible by requiring a braced `if` with one `return`, `throw`, `continue`, or `break` to use an unbraced one-line form when it fits. It leaves guards with an `else`, comments, additional statements, or multi-line syntax unchanged.

## Install

Requires Node.js 24+, ESLint `^10.9.1`, and TypeScript `>=6.0.3`.

```sh
pnpm add -D @lint-suite/eslint-plugin-one-line-guard eslint@^10.9.1 typescript@">=6.0.3" typescript-eslint
```

The plugin does not configure a TypeScript parser. Use `typescript-eslint` for TypeScript files:

```js
// eslint.config.js
import oneLineGuard from '@lint-suite/eslint-plugin-one-line-guard';
import tseslint from 'typescript-eslint';

export default [{
  files: ['**/*.ts'],
  languageOptions: { parser: tseslint.parser },
  plugins: { oneLineGuard },
  rules: { 'oneLineGuard/one-line-guard': 'error' }
}];
```

## Options

`maxLineLength` is a positive integer and defaults to `80`. The rule measures the completed line including its existing indentation. Examples that use a different limit state it explicitly.

```js
rules: { 'oneLineGuard/one-line-guard': ['error', { maxLineLength: 100 }] }
```

## Examples

Each example is checked by this rule alone, not by an entire ESLint suite.

### Valid examples

#### 1. Already unbraced return guard

<!-- prettier-ignore -->
```ts
if (!user) return null;
```

#### 2. Block with two statements

<!-- prettier-ignore -->
```ts
if (!user) {
  logMissingUser();
  return null;
}
```

#### 3. Guard with an `else`

<!-- prettier-ignore -->
```ts
if (!user) {
  return null;
} else {
  return user;
}
```

#### 4. Guard block containing a comment

<!-- prettier-ignore -->
```ts
if (!user) {
  // Preserve this explanation.
  return null;
}
```

#### 5. Guard exceeding an explicit 40-column limit

With `maxLineLength: 40`:

<!-- prettier-ignore -->
```ts
if (ready) {
  return someExtremelyLongIdentifierNameThatOverflowsTheLimit;
}
```

### Invalid examples

#### 1. Braced return guard

<!-- prettier-ignore -->
```ts
if (!user) {
  return null;
}
```

#### 2. Braced throw guard

<!-- prettier-ignore -->
```ts
if (!valid) {
  throw error;
}
```

#### 3. Braced continue guard

<!-- prettier-ignore -->
```ts
for (const item of items) {
  if (!item) {
    continue;
  }
}
```

#### 4. Braced break guard

<!-- prettier-ignore -->
```ts
while (running) {
  if (done) {
    break;
  }
}
```

#### 5. Guard exactly at an explicit 40-column limit

With `maxLineLength: 40`:

<!-- prettier-ignore -->
```ts
if (a) {
  return xxxxxxxxxxxxxxxxxxxxxxxxx;
}
```

The rule automatically fixes reported guards by removing their braces. The named `oneLineGuardRule` export is for composed plugin registries.
