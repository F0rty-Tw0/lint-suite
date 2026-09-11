# @lint-suite/eslint-plugin-ternary-branch-shape

This ESLint rule for TypeScript keeps JavaScript and TypeScript ternaries readable by requiring each branch to be a name, literal, template literal, unary literal, or plain member access. Use it when a ternary would otherwise combine selection with computation.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-ternary-branch-shape eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-ternary-branch-shape';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'ternary-branch-shape': plugin },
    rules: { 'ternary-branch-shape/ternary-branch-shape': 'error' }
  }
];
```

## Options

This rule has no options.

## Examples

Each snippet is checked by `ternary-branch-shape` alone with its default configuration.

### Valid examples

#### 1. Select between identifiers

```ts
const result = enabled ? primary : fallback;
```

Both branches are names.

#### 2. Select between literals

```ts
const result = enabled ? 1 : 'fallback';
```

Literal branches are allowed.

#### 3. Return a template literal branch

```ts
const label = enabled ? `enabled` : fallback;
```

Template literals are allowed.

#### 4. Select a plain member chain

```ts
const label = enabled ? user.profile.label : fallback;
```

The member chain does not begin with a call.

#### 5. Use a unary literal

```ts
const direction = descending ? -1 : 1;
```

A unary expression over a literal is allowed.

### Invalid examples

#### 1. Call a function in the consequent

<!-- prettier-ignore -->
```ts
const result = enabled ? createResult() : fallback;
```

The consequent branch is a call expression.

#### 2. Calculate in the alternate

<!-- prettier-ignore -->
```ts
const result = enabled ? primary : fallback + suffix;
```

The alternate branch is a binary expression.

#### 3. Use a member chain that starts from a call

<!-- prettier-ignore -->
```ts
const result = enabled ? service.create().label : fallback;
```

Plain member access cannot have a call in its object chain.

#### 4. Negate a named value

<!-- prettier-ignore -->
```ts
const result = enabled ? -score : fallback;
```

Only unary expressions over literals are allowed.

#### 5. Construct an object in a branch

<!-- prettier-ignore -->
```ts
const result = enabled ? { enabled: true } : fallback;
```

The object expression should be named before the ternary.

The rule checks both branches of every ternary expression; it does not restrict the condition. The named `ternaryBranchShapeRule` export is for composed plugin registries.
