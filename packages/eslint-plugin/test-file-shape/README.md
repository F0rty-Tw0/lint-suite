# @lint-suite/eslint-plugin-test-file-shape

`@lint-suite/eslint-plugin-test-file-shape` is an ESLint rule for TypeScript test support. It keeps stubs, mocks, fixtures, and test utilities in predictable paths, and enforces typed `UPPER_SNAKE_CASE_STUB` exports and camel-case mock factories ending in `Mock`.

## Install

Requires Node.js 24+, ESLint ^10.9.1, and TypeScript 6.0.3+.

```sh
pnpm add -D @lint-suite/eslint-plugin-test-file-shape eslint@^10.9.1 typescript@">=6.0.3" typescript-eslint
```

The plugin does not configure a TypeScript parser. Use `typescript-eslint` for TypeScript files:

```js
// eslint.config.js
import testFileShape from '@lint-suite/eslint-plugin-test-file-shape';
import tseslint from 'typescript-eslint';

export default [{
  files: ['**/*.ts'],
  languageOptions: { parser: tseslint.parser },
  plugins: { testFileShape },
  rules: { 'testFileShape/test-file-shape': 'error' }
}];
```

## Options

This rule has no options.

## Examples

Each fixture is checked by this rule alone. Filename comments are required: placement determines whether the rule applies. Stub and mock examples use `User` only as a local TypeScript type declared in the same fixture.

### Valid examples

#### 1. Ordinary production source file

```ts
// src/app/user.service.ts
export const userId = 'u1';
```

#### 2. Typed stub in `test/stubs`

```ts
// src/app/test/stubs/user.stub.ts
type User = { id: string };
export const USER_STUB: User = { id: 'u1' };
```

#### 3. Multi-segment typed stub

```ts
// src/app/test/stubs/admin-user.stub.ts
type User = { id: string };
export const ADMIN_USER_STUB: User = { id: 'u2' };
```

#### 4. Mock factory in `test/mocks`

```ts
// src/app/test/mocks/user.mock.ts
type User = { id: string };
export const userMock = (): User => ({ id: 'u1' });
```

#### 5. Spec utility in `test/utils`

```ts
// src/app/test/utils/user.spec.util.ts
export const userHarness = (): { id: string } => ({ id: 'u1' });
```

#### 6. Fixture in a testing library

```ts
// libs/testing/src/lib/fixtures/user.ts
export const userFixture = { id: 'u1' };
```

### Invalid examples

#### 1. Forbidden `.spec-support.ts` suffix

```ts
// src/app/user.spec-support.ts
export const user = {};
```

#### 2. Fixture outside `test/fixtures`

```ts
// src/app/fixtures/user.ts
export const user = {};
```

#### 3. Stub outside `test/stubs`

```ts
// src/app/stubs/user.stub.ts
type User = { id: string };
export const USER_STUB: User = { id: 'u1' };
```

#### 4. Stub with the wrong export name

```ts
// src/app/test/stubs/user.stub.ts
type User = { id: string };
export const userStub: User = { id: 'u1' };
```

#### 5. Stub without an explicit type

```ts
// src/app/test/stubs/user.stub.ts
export const USER_STUB = { id: 'u1' };
```

#### 6. Mock without the `Mock` suffix

```ts
// src/app/test/mocks/user.mock.ts
type User = { id: string };
export const user = (): User => ({ id: 'u1' });
```

#### 7. Mock factory without an explicit return type

```ts
// src/app/test/mocks/user.mock.ts
export const userMock = () => ({ id: 'u1' });
```

The named `testFileShapeRule` export is for composed plugin registries.
