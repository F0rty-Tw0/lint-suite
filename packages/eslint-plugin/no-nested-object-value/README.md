# @lint-suite/eslint-plugin-no-nested-object-value

An ESLint rule for JavaScript and TypeScript object literals that requires complex property values to be named before use. It reports non-empty nested objects, arrays containing object literals, conditional expressions, and chained calls, helping configuration and data objects keep their top-level values readable.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-no-nested-object-value eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-no-nested-object-value';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'no-nested-object-value': plugin },
    rules: { 'no-nested-object-value/no-nested-object-value': 'error' }
  }
];
```

## Options

`configFiles` defaults to:

```js
['**/*.config.{ts,js,mjs,cjs}', '**/eslint.config.*', '**/*.schema.ts']
```

Files matching one of these globs are exempt. Replace the list to use different filename exemptions:

```js
rules: {
  'no-nested-object-value/no-nested-object-value': ['error', { configFiles: ['**/generated/**'] }]
}
```

## Scope and exemptions

Object literals used as decorator arguments are exempt. So are files matching `configFiles`, including the default `*.config.ts`, `eslint.config.*`, and `*.schema.ts` patterns. Empty objects and arrays, arrays without object-literal elements, member access, and a single non-chained call are also exempt. The rule offers a hoisting suggestion only when the property key is a non-computed identifier; string and computed keys are reported without a suggestion.

## Examples

Each snippet below is checked by this rule alone, not by an entire ESLint configuration. Examples that depend on a filename or non-default option state that requirement explicitly.

### Valid examples

#### 1. Named nested object value

```ts
const data = { id: 1 };
const value = { data };
```

#### 2. Empty nested object

```ts
const value = { data: {} };
```

#### 3. Array of identifiers

```ts
const first = 1;
const second = 2;
const value = { items: [first, second] };
```

#### 4. Single call value

```ts
const value = { data: api.load() };
```

#### 5. Default config-file exemption

```ts
// Filename: eslint.config.ts
const config = { rules: { semi: 'error' } };
```

This is valid because the default `configFiles` option exempts `eslint.config.*`.

#### 6. Decorator argument exemption

```ts
@Component({ providers: [{ provide: Service, useClass: ServiceImpl }] })
class Feature {}
```

### Invalid examples

#### 1. Non-empty nested object

```ts
const value = { data: { id: 1 } };
```

Name the object before assigning it to `data`.

#### 2. Array containing an object literal

```ts
const value = { items: [{ id: 1 }] };
```

Name the array before assigning it to `items`.

#### 3. Conditional property value

```ts
const value = { status: ready ? 'ready' : 'waiting' };
```

Name the conditional result before assigning it to `status`.

#### 4. Chained call property value

```ts
const value = { data: api.load().parse() };
```

Name the chained-call result before assigning it to `data`.

#### 5. Nested object with a computed key

```ts
const value = { [key]: { id: 1 } };
```

This is reported, but has no hoisting suggestion because the key is computed.

#### 6. Nested object with a string key

```ts
const value = { 'complex-key': { id: 1 } };
```

This is reported, but has no hoisting suggestion because the key is not an identifier.

The named `noNestedObjectValueRule` export is for composed plugin registries.
