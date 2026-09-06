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
- The same rule reports and fixes `readonly T[]` and `ReadonlyArray<T>` to
  `T[]`: the property reference is readonly, the array contents stay
  mutable.
- Index signatures, mapped types, and method signatures are out of scope.
- Use `// eslint-disable-next-line local/readonly-type-properties` when a
  property genuinely needs to stay mutable.

### No inline object types

The `typescript` preset enables `local/no-inline-object-types`, which
reports every object type literal that is not the direct body of a
`type NAME = ...` alias: nested properties, array element types, union and
intersection members, generic arguments such as `Readonly<{...}>`, function
parameter and return types, `satisfies` targets, interface and class
members, and members of a `declare module` block. It is not auto-fixable:
extracting an inline object type requires choosing a name.

```ts
// Before
const describe = (field: { readonly name: string }): { readonly label: string } => ...

// After
type Field = { readonly name: string };
type FieldSummary = { readonly label: string };
const describe = (field: Field): FieldSummary => ...
```

- The direct body of a `type X = {...}` alias is the only allowed position.
- Mapped types (`{ [K in Keys]: T }`) are a different node and stay valid.

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

### Statement shape rules

The `typescript` preset enables a family of small syntactic rules that make
control flow and data shape visible by reading the code's outline. None of
them reads type information or the filesystem; each listens to one node
type and reports in microseconds per file. Where a fix needs a name the rule
offers an IDE suggestion with a placeholder name instead of an auto-fix.

| Rule | Reports | Fix |
|---|---|---|
| `local/no-call-in-condition` | A function call inside an `if` condition, or inside a boolean `const` that an `if` tests. Zero-argument `this.x()` calls (Angular signal reads) and type-predicate calls are exempt; predicates are found through scope in the same file, or through the type checker when a program is available. Option `allowPredicates` (regex sources, default `['^(is\|has)[A-Z]']`) applies when there is no program. | Suggestion: hoist to a `const` |
| `local/max-condition-operands` | An `if` condition with more than `max` (default 3) operands joined by `&&` / `\|\|`. | none |
| `local/no-grouped-condition` | A parenthesised group with a different operator inside an `if` condition or a boolean `const` (`a && (b \|\| c)`). | Suggestion: hoist the group |
| `local/ternary-branch-shape` | A ternary branch that is not a name, literal, template literal, or plain member access. | none |
| `local/chain-receiver-is-name` | A member chain starting on an inline expression: `(a ?? b).x`, `{...}.x`, `[...].x`, `(await p).x`. | Suggestion: name the receiver |
| `local/chain-fits-line` | A chain of two or more calls whose `.method(` parts sit on different lines. A multi-line callback argument does not count. | none |
| `local/arrow-body-fits-line` | An expression-bodied arrow whose body wraps onto more lines. | Fix: block body with `return` |
| `local/no-nested-object-value` | A property value that is a non-empty object literal, an array holding object literals, a ternary, or a call chain. Decorator arguments (`@Component({...})`) and files matching `configFiles` (default `**/*.config.*`, `**/eslint.config.*`, `**/*.schema.ts`) are exempt. | Suggestion: hoist to a `const` |
| `local/no-spread-expression` | `...(expr)` where the argument is not a name or member access. | Suggestion: hoist to a `const` |
| `local/no-inline-return-object` | `return {...}` and `=> ({...})`. | Suggestion: `const result = {...}; return result;` |

### Project layout rules

Also in the `typescript` preset. These read only the file's own path and
return no listeners for files they do not cover, so they cost one regex
per file.

| Rule | Reports | Options |
|---|---|---|
| `local/type-placement` | An exported `type` outside a `common/*.type.ts` or `test/common/*.type.ts` file; a value exported from a `*.type.ts` file; a non-`const` export from a `*.const.ts` file; an `import type` from a relative or internal path that is not a `*.type.ts` file. `.spec.ts`, `.stub.ts`, `.d.ts`, and fixtures are exempt; a `.spec.util.ts` file is not, so an exported type in one is reported. Never resolves imports. | `internalPatterns`: regex sources for alias prefixes that must resolve to a `*.type.ts` file. Default empty: a workspace alias (`@shared/common`) resolves to a library entry point, and module boundaries forbid deep imports, so alias type imports pass. |
| `local/util-purity` | Inside `utils/*.util.ts` (excluding paths under `test/` or `testing/`): imports of `node:fs`, `child_process`, `os`, `process`, `http`, `net`, `worker_threads`; a module-level `let`; a module-level `new Map/Set/WeakMap/WeakSet`; `process.*`, `globalThis`, `window`, `document`, `localStorage`, `console`; `Date.now`, `Math.random`, `performance.now`, `crypto.randomUUID`; `setTimeout`, `setInterval`, `fetch`, `inject`, `require`. | `bannedModules` |
| `local/test-file-shape` | A file named `*.spec-support.ts`, `*.spec-helper.ts`, `*.test-utils.ts`, `*-fixture.ts`, or under `__mocks__/` / `helpers/` / `common/stubs/`; a `.stub.ts` outside `test/stubs/`, a `.mock.ts` outside `test/mocks/`, a `.spec.util.ts` outside `test/utils/`, or any `fixtures/` directory outside `test/fixtures/` (a dedicated `testing/` library is exempt from all of these); a `test/stubs/*.stub.ts` export not named `UPPER_SNAKE_STUB` or without a type annotation; a `test/mocks/*.mock.ts` export that is not a camelCase `...Mock` function with an explicit return type. | none |
| `local/sibling-spec` | A source `.ts` file with no `<name>.spec.ts` or `<name>.<group>.spec.ts` beside it. One `existsSync` per file; the directory is listed only when the sibling is missing. Types, consts, stubs, specs, `.d.ts`, fixtures, and anything under `test/` or `testing/` are skipped. | `exempt`: globs (default `**/main.ts`, `**/*.config.ts`, `**/*.routes.ts`, `**/*.stories.ts`, `**/index.ts`, `**/environment*.ts`, `**/test-setup*.ts`) |

### No unused exports

The `typescript` preset enables `local/no-unused-exports`, which reports an
export (values and types) that no other file in the TypeScript program
imports, and a module that exports names but is never imported at all.

- Source of truth is the program typescript-eslint already built for the
  type-aware rules: no extra parse, no file enumeration, no filesystem.
- Per file the rule walks top-level statements, plus every node of a file
  whose text contains `import(`, and caches the result
  on the `ts.SourceFile` object; the project-wide usage map is cached per
  `ts.Program`, and an edit that only touches a few files patches that map
  in place instead of rebuilding it. The patch is scoped per project
  (`tsconfig`): programs from different projects never share an aggregate,
  even when ESLint alternates between them in the same process. Editing one
  file re-walks that file and rebuilds the map once. At 10k files the warm
  cost is map lookups.
- Re-exports are followed: `export { x } from`, `export * from`, and
  `export * as ns from` count usage at the file that declares `x`, so a
  barrel does not hide a dead export. `import * as ns`, default imports,
  and dynamic `import('./x')` anywhere in the file (a lazy route's
  `loadComponent: () => import('./x')` included) count every export of the
  target as used.
- Files matching `entryPoints` are never reported (default `**/main.ts`,
  `**/main.*.ts`, `**/public-api.ts`, `**/index.ts`, `**/*.config.ts`,
  `**/*.config.mts`, `**/*.config.cts`, `**/*.spec.ts`, `**/*.spec.util.ts`,
  `**/*.stub.ts`, `**/*.mock.ts`, `**/*.d.ts`, `**/*.stories.ts`,
  `**/environment*.ts`).
  Files with `export =` or a `declare module` block are skipped.
- Names an entry point re-exports (`export { x } from`, `export * from`)
  are public API and never reported: an Nx library's `index.ts` protects
  the exports other projects consume, even though those projects sit
  outside the library's own TypeScript program.
- The project is the linted file's tsconfig program. An export used only
  from a file outside that program (for example a spec excluded by
  `tsconfig.lib.json`) reports as unused; that is the same boundary `tsc`
  draws.

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
