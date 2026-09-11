# @lint-suite/eslint-plugin-util-purity

`@lint-suite/eslint-plugin-util-purity` is an ESLint rule for TypeScript utility modules. In production `utils/*.util.ts` files, it prevents I/O, ambient browser or Node state, nondeterminism, side-effecting calls, and module-level mutable state. Files below `test/` and `testing/` are excluded.

## Install

Requires Node.js 24+, ESLint ^10.9.1, and TypeScript 6.0.3+.

```sh
pnpm add -D @lint-suite/eslint-plugin-util-purity eslint@^10.9.1 typescript@">=6.0.3" typescript-eslint
```

The plugin does not configure a TypeScript parser. Use `typescript-eslint` for TypeScript files:

```js
// eslint.config.js
import utilPurity from '@lint-suite/eslint-plugin-util-purity';
import tseslint from 'typescript-eslint';

export default [{
  files: ['**/*.ts'],
  languageOptions: { parser: tseslint.parser },
  plugins: { utilPurity },
  rules: { 'utilPurity/util-purity': 'error' }
}];
```

## Options

`bannedModules` defaults to:

```js
[
  'node:fs', 'fs', 'node:fs/promises', 'fs/promises',
  'node:child_process', 'child_process', 'node:os', 'os',
  'node:process', 'process', 'node:http', 'http', 'node:https', 'https',
  'node:net', 'net', 'node:worker_threads', 'worker_threads'
]
```

```js
rules: {
  'utilPurity/util-purity': ['error', { bannedModules: ['node:fs', 'fs'] }]
}
```

A configured `bannedModules` array replaces the default. File naming is required: only production paths matching `utils/<name>.util.ts` are checked. A `.spec.util.ts` file is excluded only when it is below `test/` or `testing/`.

## Examples

Each snippet is checked by this rule alone. The filename comment is part of the fixture.

### Valid examples

#### 1. Deterministic string transformation

```ts
// src/utils/slug.util.ts
export const slug = (value: string): string => value.trim().toLowerCase();
```

#### 2. Non-banned dependency

```ts
// src/utils/parse.util.ts
import { z } from 'zod';
export const parse = (value: unknown) => z.string().parse(value);
```

#### 3. Module-level immutable primitive

```ts
// src/utils/limit.util.ts
const LIMIT = 10;
export const capped = (value: number): number => Math.min(value, LIMIT);
```

#### 4. Mutable collection created per call

```ts
// src/utils/unique.util.ts
export const unique = (values: string[]): string[] => [...new Set(values)];
```

#### 5. Test utility under `test/`

```ts
// src/test/utils/read.spec.util.ts
import { readFileSync } from 'node:fs';
export const readFixture = (file: string): string => readFileSync(file, 'utf8');
```

### Invalid examples

#### 1. Banned filesystem import

```ts
// src/utils/read.util.ts
import { readFileSync } from 'node:fs';
export const read = (file: string): string => readFileSync(file, 'utf8');
```

#### 2. Module-level `let`

```ts
// src/utils/counter.util.ts
let counter = 0;
export const next = (): number => ++counter;
```

#### 3. Module-level `Map`

```ts
// src/utils/cache.util.ts
const cache = new Map<string, string>();
export const lookup = (key: string): string | undefined => cache.get(key);
```

#### 4. Ambient process state

```ts
// src/utils/environment.util.ts
export const mode = (): string | undefined => process.env['NODE_ENV'];
```

#### 5. Nondeterministic clock

```ts
// src/utils/timestamp.util.ts
export const timestamp = (): number => Date.now();
```

#### 6. Side-effecting timer call

```ts
// src/utils/defer.util.ts
export const defer = (): void => setTimeout(() => {}, 10);
```

The named `utilPurityRule` export is for composed plugin registries.
