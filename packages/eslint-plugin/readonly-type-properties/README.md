# @lint-suite/eslint-plugin-readonly-type-properties

An ESLint rule for TypeScript type and interface property signatures. It requires `readonly` on primitive-valued properties and writes readonly array syntax as mutable `T[]`, so a type's property mutability is explicit without redundant array immutability.

## Install

Requires Node.js 24+, ESLint `^10.9.1`, and TypeScript `>=6.0.3`.

```sh
pnpm add -D @lint-suite/eslint-plugin-readonly-type-properties eslint@^10.9.1 typescript@">=6.0.3" typescript-eslint
```

The plugin does not configure a TypeScript parser. Use `typescript-eslint` for TypeScript files:

```js
// eslint.config.js
import readonlyTypeProperties from '@lint-suite/eslint-plugin-readonly-type-properties';
import tseslint from 'typescript-eslint';

export default [{
  files: ['**/*.ts'],
  languageOptions: { parser: tseslint.parser },
  plugins: { readonlyTypeProperties },
  rules: { 'readonlyTypeProperties/readonly-type-properties': 'error' }
}];
```

## Options

This rule has no options.

## Scope and exemptions

The rule checks TypeScript property signatures only: type aliases, interfaces, and inline object types. It does not check class fields, object-literal properties, methods, mapped types, or index signatures.

Only primitive keyword types (`string`, `number`, `boolean`, `bigint`, `symbol`, `null`, and `undefined`), literal and template-literal types, and unions or intersections made entirely from those types require `readonly`. Array, tuple, function, type-reference, `unknown`, `any`, `object`, `keyof`, `typeof`, and generic-parameter properties are exempt. `readonly T[]` and one-argument `ReadonlyArray<T>` are always reported and autofixed to `T[]`, independently of property signatures.

## Examples

Each snippet below is checked by this rule alone, not by an entire ESLint configuration.

### Valid examples

#### 1. Readonly primitive properties

```ts
type User = { readonly name: string; readonly active: boolean };
```

#### 2. Readonly optional property

```ts
interface Settings { readonly theme?: string }
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

Add `readonly` before `name`.

#### 2. Mutable interface number property

```ts
interface Counter { count: number }
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

Use `string[]`; the rule autofixes this form.

#### 6. `ReadonlyArray` syntax

```ts
type Group = { members: ReadonlyArray<string> };
```

Use `string[]`; the rule autofixes this form.

The named `readonlyTypePropertiesRule` export is for composed plugin registries.
