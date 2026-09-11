# @lint-suite/eslint-plugin-arrow-body-fits-line

This ESLint plugin keeps TypeScript and JavaScript expression-bodied arrow functions readable by requiring the expression body itself to occupy one physical source line. It reports multi-line non-object expression bodies and fixes them by adding a block with an explicit `return`; it does not impose a maximum line width.

## Install

Requires Node.js 24, ESLint `^10.9.1`, and TypeScript `>=6.0.3` (required by typescript-eslint's runtime utilities).

```sh
pnpm add -D @lint-suite/eslint-plugin-arrow-body-fits-line eslint typescript
```

```js
// eslint.config.js
import arrowBody from '@lint-suite/eslint-plugin-arrow-body-fits-line';

export default [{
  plugins: { arrowBody },
  rules: { 'arrowBody/arrow-body-fits-line': 'error' }
}];
```

For TypeScript syntax, configure a TypeScript parser such as `typescript-eslint` separately. This rule does not require type services. Installing this plugin does not configure a parser.

## Behavior

There are no options. Severity is chosen by the consumer. The rule checks the physical lines occupied by an expression body, not its rendered width: do not reformat these examples across lines if you want the same result. Parentheses around a reported body are removed by the fix. Object-expression bodies and existing block bodies are exempt.

## Examples

Each example is checked by this rule alone, not by an entire ESLint suite.

### Valid examples

#### 1. Single-line property read

<!-- prettier-ignore -->
```ts
const idOf = (user) => user.id;
```

#### 2. Single-line logical expression

<!-- prettier-ignore -->
```ts
const isReady = (value) => value.loaded && value.enabled;
```

#### 3. Multi-line parameters with a one-line body

<!-- prettier-ignore -->
```ts
const sum = (
  left,
  right
) => left + right;
```

#### 4. Multi-line object expression

<!-- prettier-ignore -->
```ts
const createUser = () => ({
  active: true
});
```

#### 5. Block-bodied arrow function

<!-- prettier-ignore -->
```ts
const load = async () => {
  return fetch('/api/user');
};
```

### Invalid examples

#### 1. Logical expression split after an operator

<!-- prettier-ignore -->
```ts
const isAllowed = (user) => user.active &&
  user.verified;
```

#### 2. Parenthesized expression body on several lines

<!-- prettier-ignore -->
```ts
const isComplete = () => (
  loaded &&
  saved
);
```

#### 3. Multi-line conditional expression

<!-- prettier-ignore -->
```ts
const label = (ready) => ready
  ? 'Ready'
  : 'Waiting';
```

#### 4. Multi-line member-call expression

<!-- prettier-ignore -->
```ts
const first = () => items
  .find((item) => item.active);
```

#### 5. Multi-line call arguments in the body

<!-- prettier-ignore -->
```ts
const message = () => format(
  title,
  count
);
```

The default export is an ESLint plugin; the named `arrowBodyFitsLineRule` export is intended for composed rule registries. Versions are released independently from other `@lint-suite` packages.
