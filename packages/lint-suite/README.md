# Lint Suite

A comprehensive collection of ESLint Flat configurations for modern web applications.

## Features

- **TypeScript Linting**: Strict typing rules, v8 type-safety replacements, consistent imports, and code organization
- **Angular Support**: Component best practices (including Signals), Angular 21+ template rules, and modern control flow
- **RxJS Guidelines**: Observable patterns, Finnish notation, subject encapsulation, and operator safety
- **Code Style**: Formatting rules, line limits, and structural consistency
- **Accessibility**: ARIA validation, keyboard events, and semantic HTML
- **Testing**: Jest, Vitest, and Playwright configurations with best-practice rules
- **Prettier**: Automatic disabling of formatting rules that conflict with Prettier
- **Architecture**: Module boundary enforcement with `eslint-plugin-boundaries`
- **Additional Support**: JSON (with comment support for tsconfig), Storybook CSF enforcement

## Installation

```bash
pnpm add -D lint-suite
```

## Dependencies

```bash
pnpm add -D eslint typescript-eslint eslint-config-prettier
```

## Usage

Create an `eslint.config.mjs` file in your project root:

```js
import { recommended } from 'lint-suite';

export default [...recommended];
```

Or selectively include configurations:

```js
import { base, javascript, typescript, prettier } from 'lint-suite';

export default [
  ...base,
  ...javascript,
  ...typescript,
  ...prettier // Must be last to disable conflicting formatting rules
];
```

## Available Configurations

| Configuration       | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `base`              | Core JavaScript rules, formatting, and complexity limits |
| `javascript`        | JavaScript-specific rules via `@nx/eslint-plugin`        |
| `typescript`        | TypeScript strict typing, imports, and naming conventions |
| `angular`           | Angular component best practices with Signal support     |
| `angularTemplate`   | HTML template rules with accessibility and performance   |
| `rxjs`              | Observable patterns, operator safety, and subscriptions  |
| `jest`              | Jest testing best practices and matchers                 |
| `vitest`            | Vitest testing rules and matcher improvements            |
| `playwright`        | Playwright e2e locator and matcher best practices        |
| `json`              | JSON linting with comment support for tsconfig/vscode    |
| `storybook`         | Storybook CSF enforcement                                |
| `boundaries`        | Module boundary rules (feature, data-access, ui, etc.)   |
| `prettier`          | Disables rules that conflict with Prettier (use last)    |
| **`recommended`**   | **All of the above combined in the correct order**       |

## Customization

You can override any rules by adding a `rules` section to your ESLint config:

```js
import { typescript, prettier } from 'lint-suite';

export default [
  ...typescript,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },
  ...prettier
];
```

## Available Rules (you can add more as you prefer)

### nx/eslint-plugin

- `@nx/enforce-module-boundaries`: Enforces module boundary restrictions
- `@nx/dependency-checks`: Validates dependencies in workspace projects
- ...

### eslint-plugin-jest

- `jest/consistent-test-it`: Enforces consistent test function usage (`it`)
- `jest/prefer-comparison-matcher`: Enforces comparison matchers
- `jest/prefer-hooks-on-top`: Ensures hooks are at the top of describe blocks
- `jest/no-conditional-in-test`: Warns against conditionals in tests
- ...

### @vitest/eslint-plugin

- `vitest/max-nested-describe`: Limits describe nesting depth
- `vitest/prefer-to-be`: Enforces `toBe` matcher usage
- `vitest/no-conditional-in-test`: Disallows conditionals in tests
- ...

### eslint-plugin-playwright

- `playwright/prefer-locator`: Enforces modern locator API
- `playwright/prefer-native-locators`: Prefers native locator methods
- `playwright/prefer-to-be`: Enforces `toBe` matcher usage
- ...

### eslint-plugin-json

- `json/json`: Validates JSON syntax
- `json/sort-package-json`: Enforces consistent ordering in package.json
- ...

### @smarttools/eslint-plugin-rxjs

- `@rxjs/finnish`: Enforces Finnish notation for observables
- `@rxjs/no-exposed-subjects`: Enforces subject encapsulation
- `@rxjs/no-cyclic-action`: Prevents infinite loops in NgRx effects
- `@rxjs/no-unsafe-takeuntil`: Ensures proper usage of takeUntil operator
- ...

### eslint-plugin-storybook

- `storybook/csf-component`: Enforces component property in stories
- `storybook/no-stories-of`: Prevents deprecated `storiesOf` API
- ...

### eslint-plugin-import-x

- `import-x/no-cycle`: Detects circular dependencies
- `import-x/no-self-import`: Prevents modules importing themselves
- `import-x/order`: Enforces a consistent order of import statements
- `import-x/consistent-type-specifier-style`: Consistent type import style
- ...

### @stylistic/eslint-plugin

- `@stylistic/max-len`: Enforces maximum line length
- `@stylistic/indent`: Enforces consistent indentation
- `@stylistic/quotes`: Enforces consistent quote style
- ...

### eslint-config-prettier

- Automatically disables all ESLint rules that conflict with Prettier
- Must be the last configuration in the array

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
See [CHANGELOG.md](./CHANGELOG.md) for version history.
See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for detailed release notes.

## License

MIT
