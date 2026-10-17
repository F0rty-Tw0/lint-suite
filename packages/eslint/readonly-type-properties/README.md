# @lint-suite/eslint-readonly-type-properties

An ESLint rule for TypeScript type and interface property signatures. It requires `readonly` on primitive-valued properties and writes readonly array syntax as mutable `T[]`, so a type's property mutability is explicit without redundant array immutability.

## Install

Requires Node.js 24+, ESLint `^10.9.1`, and TypeScript `>=6.0.3`.

```sh
pnpm add -D @lint-suite/eslint-readonly-type-properties eslint@^10.9.1 typescript@">=6.0.3" typescript-eslint
```

The plugin does not configure a TypeScript parser. Use `typescript-eslint` for TypeScript files:

```js
// eslint.config.js
import readonlyTypeProperties from '@lint-suite/eslint-readonly-type-properties';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { readonlyTypeProperties },
    rules: { 'readonlyTypeProperties/readonly-type-properties': 'error' }
  }
];
```

## Options

This rule has no options.

## Scope and exemptions

The rule checks TypeScript property signatures only: type aliases, interfaces, and inline object types. It does not check class fields, object-literal properties, methods, mapped types, or index signatures.

Only primitive keyword types (`string`, `number`, `boolean`, `bigint`, `symbol`, `null`, and `undefined`), literal and template-literal types, and unions or intersections made entirely from those types require `readonly`. Array, tuple, function, type-reference, `unknown`, `any`, `object`, `keyof`, `typeof`, and generic-parameter properties are exempt. `readonly T[]` and one-argument `ReadonlyArray<T>` are always reported, with a suggestion to write `T[]`, independently of property signatures.

## Fixes

A missing `readonly` is offered as an editor suggestion, not an autofix: the rule cannot see code that assigns the property, possibly in another file, and adding `readonly` there would break compilation (TS2540). `eslint --fix` therefore leaves property signatures unchanged; apply the suggestion where the property is never written, or disable the rule on that line where mutation is required.

The readonly array forms are also suggestions, not autofixes, for the same reason: the rule cannot see what is assigned to the type, possibly in another file, and rewriting `readonly T[]` or `ReadonlyArray<T>` to `T[]` breaks compilation (TS4104) where a readonly value, such as an `as const` array or an `Object.freeze` result, flows into it. `eslint --fix` leaves them unchanged; apply the suggestion where only mutable arrays are assigned, or disable the rule on that line.

## Examples

Each snippet below is checked by this rule alone, not by an entire ESLint configuration.

### Valid examples

#### 1. Readonly primitive properties

```ts
type User = { readonly name: string; readonly active: boolean };
```

#### 2. Readonly optional property

```ts
interface Settings {
  readonly theme?: string;
}
```

#### 3. Readonly literal union

```ts
type Request = { readonly method: 'GET' | 'POST' };
```

#### 4. Array-valued property exemption

```ts
type Group = { members: string[] };
```

#### 5. Type-reference property exemption

```ts
type Session = { owner: User };
```

### Invalid examples

#### 1. Mutable string property

```ts
type User = { name: string };
```

Add `readonly` before `name`; the rule suggests this edit.

#### 2. Mutable interface number property

```ts
interface Counter {
  count: number;
}
```

Add `readonly` before `count`.

#### 3. Mutable literal-union property

```ts
type Request = { method: 'GET' | 'POST' };
```

Add `readonly` before `method`.

#### 4. Mutable nullable primitive property

```ts
type Record = { id: string | null };
```

Add `readonly` before `id`.

#### 5. Readonly array type syntax

```ts
type Names = readonly string[];
```

Use `string[]`; the rule suggests this edit.

#### 6. `ReadonlyArray` syntax

```ts
type Group = { members: ReadonlyArray<string> };
```

Use `string[]`; the rule suggests this edit.

The named `readonlyTypePropertiesRule` export is for composed plugin registries.
