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
- **Stylelint**: Standalone SCSS/CSS preset (subpath `lint-suite/stylelint`) with standard + recess-order + BEM selector enforcement and `lint-suite/no-unused-classes`
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
| `angularTemplate`                                                                                             | HTML template rules with accessibility, performance, and `lint-suite-angular-template/no-unstyled-classes`             |
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

## Disk cache

`no-unstyled-classes`, `no-unused-classes`, and `no-unused-instance-fields`
parse component metadata, stylesheets, and templates once per file and keep
the result in memory for the life of the process, keyed by the file's mtime
and size. The same entries are mirrored to
`node_modules/.cache/lint-suite/*.json` under the current working directory
at process exit, so the next ESLint or stylelint process (a CI run, or an
editor's first lint) skips every parse of a file that did not change. Set
`LINT_SUITE_CACHE_DIR` to move the directory, or `LINT_SUITE_CACHE=0` to
keep everything in memory only.

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

- In an editor session the index is updated incrementally: a save re-indexes
  only the saved file and the files whose resolutions depended on it. The
  saved file's own templates, and the templates of every component in its
  folder, are re-read on every lint; edits to templates in other folders are
  picked up on a throttled schedule (at most every 100× the duration of the
  last check), so a cross-folder template edit can take a moment to show up
  in another file's diagnostics.
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

### No unstyled classes

The `angularTemplate` config enables
`lint-suite-angular-template/no-unstyled-classes`, which reports a class name
used in an Angular HTML template that no stylesheet of that component selects.
It reads three sources in the template: the static `class="a b"` attribute
(each token reported at its own column), `[class.name]` bindings, and the
literal class names inside `[class]="..."` expressions and `class="a {{ b }}"`
interpolations. String literals, object-literal keys, array elements, and both
branches of a ternary contribute names; identifiers, calls, pipes, and `+`
concatenations contribute nothing, so a class the rule cannot see is never
reported. `[ngClass]` is deliberately not analysed.

Stylesheets come from the component beside the template: `styleUrl`,
`styleUrls`, and inline `styles` read as string or template literals from the
`@Component` metadata, falling back to a sibling `.scss` or `.css` file when
the metadata declares none. A `<link rel="stylesheet" href="...">` in the
template itself is read too, resolved against the template's directory, so a
plain HTML page without a component is judged against the stylesheets it
links; root-relative (`/x.css`) and absolute (`https://...`) links are
skipped. Each stylesheet is parsed with `postcss-scss`, so
`&__element`, `&--modifier`, `&.other`, `& > .child`, `.wrapper &`, and rules
nested inside `@media` all resolve against their parent selector, and a
selector list such as `.a, .b { &__x {} }` yields both `.a__x` and `.b__x`.
`@use`, `@import`, and `@forward` are followed to their partials
(`_name.scss`, `name/index.scss`, `name/_index.scss`). A selector built with
interpolation (`.icon-#{$size}`) becomes a pattern, so `icon-lg` counts as
styled and bare `icon` does not.

```js
{
  files: ['**/*.html'],
  rules: {
    'lint-suite-angular-template/no-unstyled-classes': [
      'error',
      {
        ignoreClassPatterns: ['^(js|qa|mat|cdk|mdc)-', '^u-'],
        globalStyles: ['src/styles.scss']
      }
    ]
  }
}
```

- `ignoreClassPatterns` defaults to `['^(js|qa|mat|cdk|mdc)-']`. Each entry is
  compiled with `new RegExp(pattern, 'u')`, and a class matching any of them is
  never reported. A configured list replaces the default one instead of
  extending it.
- `globalStyles` defaults to `[]`. Paths are resolved against the ESLint
  working directory and merged into the known classes of every template. A path
  that does not exist is ignored.
- Elements whose tag name contains a dash are skipped: the classes on a child
  component, `ng-container`, or `ng-template` may be styled by that component's
  own `:host(.x)`, which this rule cannot see.
- A template with no stylesheet reports nothing. The same holds when the only
  stylesheet found fails to parse: with nothing to compare against, the rule has
  no opinion.

### No unused classes

The `stylelint` preset enables `lint-suite/no-unused-classes`, the dual of the
rule above: it reports a class selector in a component stylesheet that no
template of that component uses.

Templates are found from the stylesheet. Every `.ts` file beside it is read for
`@Component` metadata whose `styleUrl` or `styleUrls` resolves to the linted
file; each matching component contributes its `templateUrl` file or its inline
`template` literal, and their classes are merged, so a stylesheet shared by two
components is judged against both templates. When no component declares the
stylesheet, a sibling template of the same name (`card.component.scss` →
`card.component.html`) and every `.html` file in the same directory whose
`<link rel="stylesheet" href="...">` resolves to it are used instead, plus
every template anywhere under the working directory whose link resolves to
it (`node_modules`, `dist`, `coverage`, and dot-folders are skipped), so a
plain `styles.css` beside an `index.html` and a shared stylesheet linked from
other folders are both checked. A partial (`_tokens.scss`) or a global
`styles.scss` that nothing links has no template, and the rule stays silent.

Selectors resolve through the same parser as the ESLint rule, so `&__element`,
`&--modifier`, `&.other`, `& > .child`, `.wrapper &`, `@media` blocks, and
selector lists all report the resolved name on the rule that declares it: in
`.panel { .inner {} }` only `inner` is checked on the inner rule, never `panel`
twice. Arguments of `:host(.dark)` and `:host-context(.rtl)` are skipped, and
everything after `::ng-deep`, `/deep/`, or `>>>` is skipped too, because those
classes live in other templates. A selector built with interpolation
(`.icon-#{$size}`) is never reported, and `@extend .base` counts `base` as
used.

The template side reads the same sources as `no-unstyled-classes` plus
`[ngClass]`, and it does not skip custom elements: a class on
`<app-child class="foo">` is written by this template, so `.foo` counts as
used. When any template of the stylesheet holds a class source the rule cannot
read — `[class]="classes()"`, `[ngClass]="map"`, a whole token that is
`{{ expr }}`, an unparseable template — the rule reports nothing for that
stylesheet rather than guessing.

```js
// stylelint.config.mjs
import { stylelint } from 'lint-suite/stylelint';

export default {
  ...stylelint,
  overrides: [
    ...stylelint.overrides,
    {
      files: ['**/*.scss', '**/*.css'],
      rules: {
        'lint-suite/no-unused-classes': [
          true,
          { ignoreClassPatterns: ['^(js|qa|mat|cdk|mdc)-', '^u-'] }
        ]
      }
    }
  ]
};
```

- `ignoreClassPatterns` defaults to `['^(js|qa|mat|cdk|mdc)-']`. Each entry is
  compiled with `new RegExp(pattern, 'u')`, and a class matching any of them is
  never reported. A configured list replaces the default one instead of
  extending it.

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

### One-line guard

The `typescript` preset enables `local/one-line-guard` (with
`maxLineLength` set to the preset print width, 135), which reports an
`if` statement whose braced body is a lone `return`, `throw`, `continue`,
or `break` when the whole statement would fit on one line. It is
auto-fixable: the fix drops the braces and joins the guard onto the `if`
line.

```ts
// Before
if (!user) {
  return null;
}

// After
if (!user) return null;
```

- Only a block body containing exactly one `return`, `throw`, `continue`,
  or `break` statement is considered a guard; any other body is left
  alone.
- The rule bails out (no report, no fix) when the `if` has an `else`,
  the block holds a comment, the condition spans multiple lines, the
  guard statement spans multiple lines, or the collapsed line would
  exceed `maxLineLength`.
- Pass a different width with the rule's options:
  `'local/one-line-guard': ['error', { maxLineLength: 80 }]`.
- Complements `curly: multi-line`: that rule tolerates a brace-less
  single-line guard once it exists, while `local/one-line-guard` is what
  collapses a braced guard down to one line in the first place.

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
- `lint-suite/no-unused-classes`: reports a class selector no template of the component uses (see [No unused classes](#no-unused-classes))
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
