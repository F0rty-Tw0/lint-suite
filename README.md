# Lint Suite

[![NPM Version](https://img.shields.io/npm/v/lint-suite.svg)](https://www.npmjs.com/package/lint-suite)
[![License](https://img.shields.io/npm/l/lint-suite.svg)](https://github.com/F0rty-Tw0/lint-suite/blob/main/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/dm/lint-suite.svg)](https://www.npmjs.com/package/lint-suite)

A comprehensive collection of ESLint Flat configurations for modern web applications.

## Features

- **TypeScript Linting**: Strict typing rules, consistent imports, and code organization
- **Angular Support**: Component best practices and template accessibility rules
- **RxJS Guidelines**: Observable patterns, Finnish notation, and operator safety
- **Code Style**: Formatting rules, line limits, and structural consistency
- **Accessibility**: ARIA validation, keyboard events, and semantic HTML
- **Testing**: Jest configurations with appropriate relaxations for test files
- **Additional Support**: JSON, Storybook, and more

## Installation

```bash
pnpm add -D lint-suite
```

## Usage

Create a `.eslintrc.config.mjs` file in your project root:

```js
import { base, javascript, typescript } from 'lint-suite';

export default [
  ...base,
  ...javascript,
  ...typescript,
  // Rest of the required configurations
];
```

You can selectively include configurations you need.

## Available Configurations

- `base`: Core JavaScript and Typescript rules and formatting
- `typescript`: TypeScript-specific rules
- `angular`: Angular component best practices
- `angularTemplate`: Angular HTML template rules with accessibility focus
- `rxjs`: Observable patterns and operator safety
- `jest`: Testing configurations
- `json`: JSON file linting
- `storybook`: Storybook support

## Customization

You can override any rules by adding a `rules` section to your ESLint config:

```js
import { typescript } from 'lint-suite';

export default [
  ...typescript,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
```

## Available Rules (you can add more as you prefer)

### nx/eslint-plugin

- `@nx/enforce-module-boundaries`: Enforces module boundary restrictions
- `@nx/dependency-checks`: Validates dependencies in workspace projects
- ...

### eslint-plugin-jest

- `jest/no-disabled-tests`: Disallows disabled tests
- `jest/expect-expect`: Ensures test cases contain at least one expect statement
- `jest/valid-expect`: Validates expect() usage
- ...

### eslint-plugin-json

- `json/json`: Validates JSON syntax
- `json/sort-package-json`: Enforces consistent ordering in package.json
- ...

### @smarttools/eslint-plugin-rxjs

- `@rxjs/finnish`: Enforces Finnish notation for observables
- `@rxjs/no-ignored-subscription`: Prevents ignoring returned subscriptions
- `@rxjs/no-unsafe-takeuntil`: Ensures proper usage of takeUntil operator
- ...

### eslint-plugin-storybook

- `storybook/no-redundant-story-name`: Prevents redundant story names
- `storybook/csf-component`: Enforces Component Story Format standards
- `storybook/hierarchy-separator`: Enforces story hierarchy separators
- ...

### eslint-plugin-import

- `import/no-unresolved`: Ensures imports point to valid modules
- `import/order`: Enforces a consistent order of import statements
- `import/no-duplicates`: Prevents duplicate imports
- ...

### @stylistic/eslint-plugin

- `@stylistic/max-len`: Enforces maximum line length
- `@stylistic/indent`: Enforces consistent indentation
- `@stylistic/quotes`: Enforces consistent quote style
- ...

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
