# @lint-suite/eslint-plugin-no-spread-expression

This ESLint rule for TypeScript requires each JavaScript or TypeScript spread argument to be a named value or member access, not an inline expression. Use it to make arrays, object merges, and variadic calls show where their spread data came from.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-no-spread-expression eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-no-spread-expression';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'no-spread-expression': plugin },
    rules: { 'no-spread-expression/no-spread-expression': 'error' }
  }
];
```

## Options

This rule has no options.

## Examples

Each snippet is checked by `no-spread-expression` alone with its default configuration.

### Valid examples

#### 1. Spread a named call argument list

```ts
send(...args);
```

An identifier is allowed.

#### 2. Spread a member into a call

```ts
send(...request.args);
```

A member expression is allowed.

#### 3. Spread a member into an array

```ts
const items = [...response.items];
```

The array spread argument is a member expression.

#### 4. Spread a member into an object

```ts
const options = { ...defaults.options };
```

The object spread argument is a member expression.

#### 5. Name a computed spread value first

```ts
const selectedItems = getSelectedItems();
const items = [...selectedItems];
```

The call result is named before it is spread.

### Invalid examples

#### 1. Spread a call result into a call

<!-- prettier-ignore -->
```ts
send(...getArgs());
```

The call expression must be assigned to a constant first.

#### 2. Spread a call result into an array

<!-- prettier-ignore -->
```ts
const items = [...getItems()];
```

The inline call is reported in any spread position.

#### 3. Spread an object literal

<!-- prettier-ignore -->
```ts
const options = { ...{ enabled: true } };
```

The object expression is not an identifier or member expression.

#### 4. Spread a conditional expression

<!-- prettier-ignore -->
```ts
const items = [...(enabled ? primary : fallback)];
```

Name the selected collection before spreading it.

#### 5. Spread a logical expression

<!-- prettier-ignore -->
```ts
const options = { ...(overrides ?? defaults) };
```

The fallback expression must be assigned to a named value first.

The rule allows only an identifier or member expression as a spread argument and reports every other expression. It provides a suggestion to assign the expression to `const spread` before spreading it.
