# @lint-suite/eslint-plugin-no-unused-exports

`@lint-suite/eslint-plugin-no-unused-exports` is an ESLint rule for TypeScript projects that finds exported names and export-only modules with no importing project file. It uses the TypeScript program, so it is intended for project-wide API cleanup rather than isolated-file linting.

## Install

Requires Node.js 24+, ESLint ^10.9.1, and TypeScript 6.0.3+.

```sh
pnpm add -D @lint-suite/eslint-plugin-no-unused-exports eslint@^10.9.1 typescript@">=6.0.3" typescript-eslint
```

This rule needs type-aware `typescript-eslint` parsing and a real `tsconfig.json`. Installing the plugin does not configure a parser or TypeScript project.

```json
// tsconfig.json
{
  "compilerOptions": { "strict": true },
  "include": ["src/**/*.ts"]
}
```

```js
// eslint.config.js
import noUnusedExports from '@lint-suite/eslint-plugin-no-unused-exports';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['src/**/*.ts'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { projectService: true }
  },
  plugins: { noUnusedExports },
  rules: { 'noUnusedExports/no-unused-exports': 'error' }
});
```

## Options

`entryPoints` is an array of glob patterns for files whose exports are public. The default is:

```js
[
  '**/main.ts', '**/main.*.ts', '**/public-api.ts', '**/index.ts',
  '**/*.config.ts', '**/*.config.mts', '**/*.config.cts', '**/*.spec.ts',
  '**/*.spec.util.ts', '**/*.stub.ts', '**/*.mock.ts', '**/*.d.ts',
  '**/*.stories.ts', '**/environment*.ts'
]
```

```js
rules: {
  'noUnusedExports/no-unused-exports': ['error', {
    entryPoints: ['src/public-api.ts']
  }]
}
```

## Examples

Each fixture below is checked by this rule alone, with the shown files included by the `tsconfig.json` above. Examples marked **entry point** use the default `entryPoints`; changing that option changes which files are exempt.

### Valid examples

#### 1. Named export imported by a sibling

```ts
// src/value.ts
export const value = 1;

// src/consumer.ts
import { value } from './value.ts';
console.log(value);
```

#### 2. Type export imported with `import type`

```ts
// src/user.type.ts
export type User = { id: string };

// src/consumer.ts
import type { User } from './user.type.ts';
const user: User = { id: 'u1' };
```

#### 3. Export used through a barrel

```ts
// src/feature.ts
export const feature = 'on';

// src/index.ts — entry point
export { feature } from './feature.ts';

// src/main.ts — entry point
import { feature } from './index.ts';
console.log(feature);
```

#### 4. Export reached through a star barrel

```ts
// src/feature.ts
export const feature = 'on';

// src/public-api.ts — entry point
export * from './feature.ts';
```

#### 5. Export in a module cycle

```ts
// src/a.ts
import { b } from './b.ts';
export const a = b + 1;

// src/b.ts
import { a } from './a.ts';
export const b = a + 1;
```

### Invalid examples

#### 1. Export nobody imports

```ts
// src/orphan.ts
export const orphan = 'remove me';
```

#### 2. Unimported module with multiple exports

```ts
// src/orphan-module.ts
export const first = 1;
export const second = 2;
```

The rule reports the module as never imported.

#### 3. Unused export beside a used export

```ts
// src/values.ts
export const used = 1;
export const unused = 2;

// src/consumer.ts
import { used } from './values.ts';
console.log(used);
```

The rule reports `unused`.

#### 4. Dead barrel re-export

```ts
// src/feature.ts
export const feature = 1;

// src/barrel.ts
export { feature } from './feature.ts';
```

The rule reports the re-export and its origin because no project file imports the barrel.

#### 5. Dead star barrel

```ts
// src/feature.ts
export const feature = 1;

// src/barrel.ts
export * from './feature.ts';
```

The rule reports the unused barrel module and the export reached only through it.

The named `noUnusedExportsRule` export is for composed plugin registries.
