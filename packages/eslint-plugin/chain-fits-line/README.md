# @lint-suite/eslint-plugin-chain-fits-line

This ESLint plugin keeps TypeScript and JavaScript member-call chains compact by requiring every call property in a chain to remain on one physical source line. It helps make long fluent chains explicit: keep the chain together or name an intermediate result.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-chain-fits-line eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-chain-fits-line';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'chain-fits-line': plugin },
    rules: { 'chain-fits-line/chain-fits-line': 'error' }
  }
];
```

## Options

This rule has no options and no line-width setting. It compares the physical source lines of call property names, so reformatting an example can change whether it is reported.

## Examples

Each example is checked by this rule alone, not by an entire ESLint suite.

### Valid examples

#### 1. Two calls on one line

<!-- prettier-ignore -->
```ts
service.prepare().run();
```

#### 2. Three calls on one line

<!-- prettier-ignore -->
```ts
request.withToken().send().json();
```

#### 3. A single member call spread across lines

<!-- prettier-ignore -->
```ts
items
  .map((item) => item.id);
```

#### 4. A member-access prefix split before a compact chain

<!-- prettier-ignore -->
```ts
client
  .session.prepare().run();
```

#### 5. A multi-line callback argument on one member call

<!-- prettier-ignore -->
```ts
items.map((item) => {
  return item.id;
});
```

### Invalid examples

#### 1. Two-call chain split before the final call

<!-- prettier-ignore -->
```ts
service.prepare()
  .run();
```

#### 2. Each call property on a separate line

<!-- prettier-ignore -->
```ts
request
  .withToken()
  .send();
```

#### 3. Three-call chain split once

<!-- prettier-ignore -->
```ts
pipeline.start().transform()
  .finish();
```

#### 4. Chain split after a compact first call

<!-- prettier-ignore -->
```ts
store.select()
  .filter(Boolean)
  .map(render);
```

#### 5. Nested member-call chain split across lines

<!-- prettier-ignore -->
```ts
client.api.create()
  .execute();
```

The rule reports only member-call chains with at least two calls when their property names span lines. It does not report a single member call split across lines.
