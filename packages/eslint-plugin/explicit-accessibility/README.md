# @lint-suite/eslint-plugin-explicit-accessibility

This ESLint plugin requires TypeScript class members to state `public`, `private`, or `protected` explicitly. It makes an Angular or TypeScript class API visible at the declaration site and checks only supported class-member syntax, not JavaScript object literals.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-explicit-accessibility eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-explicit-accessibility';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'explicit-accessibility': plugin },
    rules: { 'explicit-accessibility/explicit-accessibility': 'error' }
  }
];
```

## Options

`defaultAccessibility` controls the automatic fix and defaults to `"public"`:

| Value         | Result                           |
| ------------- | -------------------------------- |
| `"public"`    | Fix with `public`.               |
| `"private"`   | Fix with `private`.              |
| `"protected"` | Fix with `protected`.            |
| `"none"`      | Report without an automatic fix. |

Constructors are always automatically fixed with `public` when `defaultAccessibility` is not `"none"`. Constructor parameter properties use the configured accessibility like other members. The rule still offers the other accessibility levels as suggestions.

```js
rules: {
  'explicit-accessibility/explicit-accessibility': ['error', { defaultAccessibility: 'private' }]
}
```

## Examples

Each example is checked by this rule alone, not by an entire ESLint suite.

### Valid examples

#### 1. Public method

```ts
class Service {
  public run(): void {}
}
```

#### 2. Private readonly field

```ts
class Service {
  private readonly cache = new Map();
}
```

#### 3. Protected accessor

```ts
class Base {
  protected get ready(): boolean {
    return true;
  }
}
```

#### 4. Explicit constructor parameter property

```ts
class Service {
  public constructor(private readonly client: Client) {}
}
```

#### 5. ECMAScript private member

```ts
class Service {
  #cache = new Map();
}
```

### Invalid examples

#### 1. Method without accessibility

```ts
class Service {
  run(): void {}
}
```

#### 2. Field without accessibility

```ts
class Service {
  cache = new Map();
}
```

#### 3. Constructor without accessibility

```ts
class Service {
  constructor() {}
}
```

#### 4. Constructor parameter property without accessibility

```ts
class Service {
  public constructor(readonly client: Client) {}
}
```

#### 5. Getter without accessibility

```ts
class Service {
  get active(): boolean {
    return true;
  }
}
```

#### 6. Abstract method without accessibility

```ts
abstract class Service {
  abstract run(): void;
}
```

The rule checks fields, methods, accessors, abstract members, and constructor parameter properties. ECMAScript `#private` members are exempt.
