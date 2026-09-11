# @lint-suite/eslint-plugin-chain-receiver-is-name

This ESLint plugin makes TypeScript and JavaScript member access easier to read by requiring an inline expression receiver to be extracted to a name before accessing a property or starting a chain. It targets direct receivers whose value is computed inline, while preserving ordinary names, calls, and `this` access.

## Compatibility

Requires ESLint `^10.9.1` and TypeScript `>=6.0.3`. The package is built and tested with Node.js 24.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-chain-receiver-is-name eslint@^10.9.1 typescript@^6.0.3 typescript-eslint@^8.69.0
```

## Configuration

The plugin does not configure a parser. This flat config parses the TypeScript examples below:

```js
import plugin from '@lint-suite/eslint-plugin-chain-receiver-is-name';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'chain-receiver-is-name': plugin },
    rules: { 'chain-receiver-is-name/chain-receiver-is-name': 'error' }
  }
];
```

## Options

This rule has no options.

## Examples

Each example is checked by this rule alone, not by an entire ESLint suite.

### Valid examples

#### 1. Named logical-expression result

```ts
const receiver = primary ?? fallback;
receiver.trim();
```

#### 2. Plain identifier receiver

```ts
user.profile.name;
```

#### 3. `this` receiver

```ts
this.connection.close();
```

#### 4. Call-expression receiver

```ts
createClient().connect();
```

#### 5. Member-expression receiver

```ts
settings.current.toString();
```

### Invalid examples

#### 1. Logical-expression receiver

```ts
(primary ?? fallback).trim();
```

#### 2. Conditional-expression receiver

```ts
(enabled ? primary : fallback).trim();
```

#### 3. Object-expression receiver

```ts
({ name: 'Ada' }).name;
```

#### 4. Array-expression receiver

```ts
['Ada', 'Lin'].length;
```

#### 5. Await-expression receiver

```ts
async function load() {
  return (await getUser()).name;
}
```

#### 6. Binary-expression receiver

```ts
(left + right).toString();
```

#### 7. Template-literal receiver

```ts
`${prefix}-${id}`.length;
```

The rule reports a member expression whose direct receiver is a logical, conditional, object, array, `await`, binary, or template expression. It provides a suggestion that extracts the receiver to a `value` constant; it does not apply that suggestion automatically. Other receiver forms are not reported.
