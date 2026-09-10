# @lint-suite/eslint-plugin-no-inline-object-types

An ESLint rule for TypeScript that keeps object type literals in named type aliases. It prevents inline object types in parameters, properties, generic arguments, and other nested positions while allowing a type alias's direct object body.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-no-inline-object-types eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-no-inline-object-types';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'no-inline-object-types': plugin },
    rules: { 'no-inline-object-types/no-inline-object-types': 'error' }
  }
];
```

## Options

This rule has no options.

## Scope and exemptions

The only exempt object type literal is the direct right-hand side of a `type` alias. The rule still reports object type literals nested in a type alias's union, intersection, property, array element, or generic argument. Interfaces are not exempt: their inline member object types are reported.

## Examples

Each snippet below is checked by this rule alone, not by an entire ESLint configuration.

### Valid examples

#### 1. Direct type-alias object body

```ts
type User = { readonly name: string };
```

#### 2. Generic type-alias object body

```ts
type Result<T> = { readonly value: T };
```

#### 3. Alias that references a named type

```ts
type Session = User;
```

#### 4. Array type alias

```ts
type Users = User[];
```

#### 5. Mapped type alias

```ts
type Flags = { [Key in 'open' | 'closed']: boolean };
```

### Invalid examples

#### 1. Nested property object type

```ts
type Order = { customer: { name: string } };
```

Extract `{ name: string }` into its own named alias.

#### 2. Object array element type

```ts
type Order = { lines: { sku: string }[] };
```

Name the array element object type.

#### 3. Union member object type

```ts
type Result = { value: { id: string } | null };
```

Name the object member before using it in the union.

#### 4. Intersection object types

```ts
type Model = { id: string } & { updatedAt: Date };
```

Both object literals are nested in the intersection and are reported.

#### 5. Function parameter object type

```ts
function save(input: { title: string }): void {}
```

Declare a named input type instead.

#### 6. Generic object argument

```ts
type State = Readonly<{ open: boolean }>;
```

Declare the object shape as a named type before passing it to `Readonly`.
