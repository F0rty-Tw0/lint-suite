# Lint Suite

A comprehensive collection of ESLint Flat configurations for modern web applications.

## Features

- **TypeScript Linting**: Strict typing rules, v8 type-safety replacements, consistent imports, and code organization
- **Angular Support**: Component best practices (including Signals), Angular 21+ template rules, and modern control flow
- **RxJS Guidelines**: Observable patterns, Finnish notation, subject encapsulation, and operator safety
- **Code Style**: Formatting rules, line limits, and structural consistency
- **Accessibility**: ARIA validation, keyboard events, and semantic HTML
- **Testing**: Vitest and Playwright configurations with best-practice rules
- **Prettier**: Automatic disabling of formatting rules that conflict with Prettier (`eslint-config-prettier`)
- **Prettier config**: Standalone formatting preset (subpath `lint-suite/prettier`) with the suite's house defaults and Angular/HTML overrides
- **Stylelint**: Standalone SCSS/CSS preset (subpath `lint-suite/stylelint`) with standard + recess-order + BEM selector enforcement
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

If you use the Prettier preset (`lint-suite/prettier`), also install its peer dependency:

```bash
pnpm add -D prettier
```

## Usage

Create an `eslint.config.mjs` file in your project root:

```js
import { recommended } from 'lint-suite/eslint';

export default [...recommended];
```

Or selectively include configurations:

```js
import { base, javascript, typescript, prettier } from 'lint-suite/eslint';

export default [
  ...base,
  ...javascript,
  ...typescript,
  ...prettier // Must be last to disable conflicting formatting rules
];
```

### Composing framework configs on top

`recommended` is intentionally framework-agnostic — it ships only the language + architecture + format baseline (`base`, `javascript`, `typescript`, `json`, `boundaries`, `prettier`). Add the framework/tooling configs your project actually uses:

```js
import {
  recommended,
  angular,
  angularTemplate,
  rxjs,
  vitest
} from 'lint-suite/eslint';

export default [
  ...recommended,
  ...angular,
  ...angularTemplate,
  ...rxjs,
  ...vitest
];
```

`recommended` already ends with `prettier`. The composable configs above are rule-only, so appending them after `recommended` is safe — but if a config you add re-enables a formatting rule, append `...prettier` again at the very end.

## Available Configurations

| Configuration                                                                                                 | Description                                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `base`                                                                                                        | Core JavaScript rules, formatting, and complexity limits                                                               |
| `javascript`                                                                                                  | JavaScript-specific rules via `@nx/eslint-plugin`                                                                      |
| `typescript`                                                                                                  | TypeScript strict typing, imports, and naming conventions                                                              |
| `angular`                                                                                                     | Angular component best practices with Signal support                                                                   |
| `angularTemplate`                                                                                             | HTML template rules with accessibility and performance                                                                 |
| `rxjs`                                                                                                        | Observable patterns, operator safety, and subscriptions                                                                |
| `vitest`                                                                                                      | Vitest testing rules and matcher improvements                                                                          |
| `playwright`                                                                                                  | Playwright e2e locator and matcher best practices                                                                      |
| `json`                                                                                                        | JSON linting with comment support for tsconfig/vscode                                                                  |
| `storybook`                                                                                                   | Storybook CSF enforcement                                                                                              |
| `boundaries`                                                                                                  | Module boundary rules (feature, data-access, ui, etc.)                                                                 |
| `prettier`                                                                                                    | Disables rules that conflict with Prettier (use last)                                                                  |
| **`recommended`**                                                                                             | **Baseline only: `base` + `javascript` + `typescript` + `json` + `boundaries` + `prettier` — compose the rest on top** |
| **Angular project analysis:** The `angular` preset enables `projectService: true` and project analysis for    |
| `lint-suite-angular/no-unused-instance-fields`. It counts exact reads in the configured TypeScript/Angular    |
| Program, including external parent templates/TypeScript, subclasses, and Angular interface implementations;   |
| code outside that Program is unknowable. Project mode also reports unused public/protected directive members. |
| Direct rule usage remains local by default, and `allowEffectFields` is opt-in. After cross-file or template   |
| changes, do not use ESLint `--cache` for correctness gates; run a full non-cached lint (for example,          |
| `eslint --no-cache`).                                                                                         |

## Customization

You can override any rules by adding a `rules` section to your ESLint config:

```js
import { typescript, prettier } from 'lint-suite/eslint';

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

### Unused Angular instance fields

The `angular` config enables `lint-suite-angular/no-unused-instance-fields`.
Local analysis recognizes reads from the class, component template, and host
expressions. Use project analysis when other TypeScript files or Angular
templates can read a component or directive member:

```js
{
  files: ['**/*.ts'],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  },
  rules: {
    'lint-suite-angular/no-unused-instance-fields': [
      'error',
      {
        analysis: 'project',
        allowEffectFields: true
      }
    ]
  }
}
```

- `analysis` defaults to `'local'`. Project mode excludes spec-file reads. A
  file it cannot index exactly (a template that does not parse, metadata it
  cannot evaluate, a read it cannot type) falls back to name matching for
  that file only: every member whose name that file mentions counts as read.
  Set `LINT_SUITE_DEBUG=1` to print which files fell back and why, for
  example `LINT_SUITE_DEBUG=1 eslint --no-cache src/app/some.component.ts`.
- `allowEffectFields` defaults to `false`. When enabled, fields holding
  auto-cleaned Angular `effect()` calls are allowed; effects configured with
  `manualCleanup: true` must still be read.
- Angular signal inputs, models, outputs, and query fields are always treated
  as framework-managed.
- Fields typed with `ComponentRef` imported from `@angular/core` are excluded
  from unused-field reports.
- In local mode, non-private members of `abstract` components and directives
  are exempt: subclasses that read them live in other files. Project mode
  resolves those subclass reads and reports the members normally.
- Project analysis is incremental. The index is kept per tsconfig; when an
  editor hands the rule a changed Program after a save, only the saved file and
  the files whose reads depended on it are re-indexed, so feedback stays fast
  in large workspaces. Template references (`#ref`, `#ref="exportAs"`) resolve
  within a standalone component's `imports`; when that scope cannot be
  determined statically (NgModule declarations, `hostDirectives`, spreads),
  every matching component or directive in the Program is a candidate. Extra
  candidates can only add reads. Metadata strings may be constants.

### Explicit accessibility

The `typescript` preset enables `local/explicit-accessibility`, which reports
class members (fields, methods, accessors, abstract members, and constructor
parameter properties) without an explicit `public`, `private`, or `protected`
modifier. `#private` members are ignored: TypeScript forbids a modifier there.

```js
{
  rules: {
    'local/explicit-accessibility': [
      'error',
      { defaultAccessibility: 'private' }
    ]
  }
}
```

- `defaultAccessibility` defaults to `public` and drives `eslint --fix`; the
  IDE offers the other two levels as suggestions.
- `defaultAccessibility: 'none'` reports without an auto-fix and offers all
  three levels as suggestions.
- Constructors are always fixed to `public`. A private constructor breaks
  `new` and dependency injection.
- The fix does not default to `private` because members implementing an
  interface or read by an Angular template must stay non-private, and the
  rule cannot see either.

### Readonly type properties

The `typescript` preset enables `local/readonly-type-properties`, which
reports primitive-typed properties in `type` aliases, interfaces, and
inline object types that are not marked `readonly`, and auto-fixes them
with `eslint --fix`. A property is primitive-typed when its annotation is
`string`, `number`, `boolean`, `bigint`, `symbol`, `null`, `undefined`, a
literal or template-literal type, or a union/intersection of those.

```ts
// Before
type User = { name: string; roles: string[]; profile: Profile };

// After --fix
type User = { readonly name: string; roles: string[]; profile: Profile };
```

- Arrays, object types, type references (including string-union aliases
  like `Status`), functions, and tuples are left untouched because the
  rule is syntactic and does not resolve types.
- Index signatures, mapped types, and method signatures are out of scope.
- Use `// eslint-disable-next-line local/readonly-type-properties` when a
  property genuinely needs to stay mutable.

### No inline object types

The `typescript` preset enables `local/no-inline-object-types`, which
reports object type literals nested inside a `type NAME = ...` alias
declaration (nested properties, array element types, union members,
intersection members, and generic arguments such as `Readonly<{...}>`).
It is not auto-fixable: extracting an inline object type requires
choosing a name.

```ts
// Before
type LineItem = { readonly name: string; readonly item: { readonly id: string } };

// After
type Item = { readonly id: string };
type LineItem = { readonly name: string; readonly item: Item };
```

- The direct body of a `type X = {...}` alias is allowed to be an object
  literal; any object type literal nested inside that alias must reference
  a named type instead.
- Positions outside a type alias — function parameters and return types,
  `as`/`satisfies` expressions, generic call arguments, interface members,
  and class members — are not checked by this rule.
- Declare the shape as `type Item = {...}` and reference it instead of
  inlining the object type.

## Stylelint and Prettier presets

These are standalone configs exported as subpaths — they are not part of the `recommended` ESLint array.

```js
// stylelint.config.mjs
import { stylelint } from 'lint-suite/stylelint';

export default stylelint;
```

```js
// prettier.config.mjs
import { prettier } from 'lint-suite/prettier';

export default prettier;
```

The Prettier preset is published with `prettier` as a peer dependency. The Stylelint preset requires `stylelint` and the referenced shared configs/plugins, which ship as dependencies of this package.

## Available Rules (you can add more as you prefer)

### nx/eslint-plugin

- `@nx/enforce-module-boundaries`: Enforces module boundary restrictions
- `@nx/dependency-checks`: Validates dependencies in workspace projects
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

### stylelint

- Scoped to `**/*.scss` and `**/*.css` via an `overrides` entry (SCSS is a CSS superset; SCSS-only rules simply don't fire on `.css`)
- Extends `stylelint-config-standard`, `stylelint-config-standard-scss`, and `stylelint-config-recess-order`
- `selector-class-pattern`: BEM-aware class names with ITCSS-style namespace prefixes (`o-`, `c-`, `u-`, `is-`, `has-`, `js-`, `qa-`, etc.)
- `plugin/selector-bem-pattern`: enforces BEM selectors, treats `*.component.scss`/`*.component.css` as implicit components, ignores `--mdc`/`--sys` custom properties
- `no-descending-specificity`: disabled

### prettier (format config)

- `singleQuote: true`, `semi: true`, `tabWidth: 2`, `printWidth: 135`
- `trailingComma: 'none'`, `bracketSpacing: true`, `bracketSameLine: true`, `arrowParens: 'always'`, `endOfLine: 'lf'`
- Overrides: `*.html` → `html` parser, `*.component.html` → `angular` parser

## Contributing

See [CONTRIBUTING.md](https://github.com/F0rty-Tw0/lint-suite/blob/main/CONTRIBUTING.md) for contribution guidelines.
See [CHANGELOG.md](./CHANGELOG.md) for version history.
See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for detailed release notes.

## License

MIT
