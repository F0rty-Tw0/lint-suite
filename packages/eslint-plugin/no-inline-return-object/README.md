# @lint-suite/eslint-plugin-no-inline-return-object

An ESLint rule for JavaScript and TypeScript that requires directly returned object literals to be named first. It makes returned values easier to inspect and reuse by reporting object literals in `return` statements and expression-bodied arrow functions.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-no-inline-return-object eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-no-inline-return-object';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'no-inline-return-object': plugin },
    rules: { 'no-inline-return-object/no-inline-return-object': 'error' }
  }
];
```

## Options

This rule has no options.

## Scope and exemptions

The rule reports only an `ObjectExpression` returned directly by a `return` statement or by an expression-bodied arrow function. It does not report named results, primitive values, array expressions, object literals that are merely assigned, or object literals nested inside another returned expression. Every report includes a suggestion that introduces a `const result`.

## Examples

Each snippet below is checked by this rule alone, not by an entire ESLint configuration.

### Valid examples

#### 1. Return a named result

```ts
function create() {
  const result = { ok: true };

  return result;
}
```

#### 2. Arrow returns a named result

```ts
const create = () => {
  const result = { ok: true };

  return result;
};
```

#### 3. Primitive return value

```ts
function status(): number {
  return 200;
}
```

#### 4. Array expression return value

```ts
const ids = () => [1, 2, 3];
```

#### 5. Assigned object that is not returned

```ts
const result = { ok: true };
void result;
```

### Invalid examples

#### 1. Object literal in a function return

```ts
function create() {
  return { ok: true };
}
```

Name the object before returning it.

#### 2. Empty object literal in a return

```ts
function create() {
  return {};
}
```

Name the empty object before returning it.

#### 3. Object literal in an arrow block return

```ts
const create = () => {
  return { ok: true };
};
```

Name the object before returning it.

#### 4. Object literal arrow expression body

```ts
const create = () => ({ ok: true });
```

Use a block body with a named result and an explicit `return`.

#### 5. Nested arrow expression body

```ts
class Factory {
  create() {
    return () => ({ ok: true });
  }
}
```

The expression-bodied inner arrow returns an object literal directly.

The named `noInlineReturnObjectRule` export is for composed plugin registries.
