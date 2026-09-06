# Changelog

## [Unreleased]

### Fixes

- **`local/type-placement`**: `*.schema.ts` files are exempt (an inferred type lives beside its schema), and
  an `import type` from a `*.schema.ts` file passes.
- **TypeScript**: `@typescript-eslint/no-inferrable-types` is off for `**/*.stub.ts`; `local/test-file-shape`
  requires `STUB: Type` there, which the two rules otherwise fight over for literal stubs.

## [2.0.0] - 2026-09-06

### Breaking

- **TypeScript**: `@typescript-eslint/consistent-type-assertions` now uses `assertionStyle: 'never'`: every
  `as` cast except `as const` is an error. Narrow with type predicates or fix the declared type.
- **TypeScript**: `@typescript-eslint/parameter-properties` is on, and `no-restricted-syntax` bans non-ambient
  `enum` and `namespace` declarations (erasable syntax only).
- **TypeScript**: `local/no-inline-object-types` now reports every object type literal that is not the body
  of a type alias (parameter and return types, generic arguments, `satisfies`, interface and class members,
  `declare module` members), not only literals nested inside an alias.
- **TypeScript**: `local/readonly-type-properties` also reports and fixes `readonly T[]` and
  `ReadonlyArray<T>` to `T[]`.
- **TypeScript**: sixteen new `local/*` rules are enabled in the `typescript` preset (see the README
  sections "Statement shape rules", "Project layout rules", "No unused exports"): `no-call-in-condition`,
  `max-condition-operands`, `no-grouped-condition`, `ternary-branch-shape`, `chain-receiver-is-name`,
  `chain-fits-line`, `arrow-body-fits-line`, `no-nested-object-value`,
  `no-spread-expression`, `no-inline-return-object`, `type-placement`, `util-purity`,
  `test-file-shape`, `no-unused-exports`.

### Features

- **`local/no-unused-exports`**: project-wide unused export and unused module detection built on the
  program typescript-eslint already holds. No extra parsing or filesystem access; per-file results are
  cached on the `ts.SourceFile`, the usage map per `ts.Program`, and re-exports (`export { x } from`,
  `export * from`, `export * as ns from`) are followed to the declaring file. Names re-exported by an
  entry point (`index.ts`, `public-api.ts`, ...) are public API and never reported; `*.config.mts`,
  `*.config.cts`, `main.*.ts`, and `environment*.ts` are entry points too. A dynamic `import()` anywhere
  in a file (lazy routes) marks its target as used.

### Fixes

- **`local/type-placement`**: `internalPatterns` defaults to `[]`. The old alias list made every
  `import type` from a workspace alias an error that Nx module boundaries left no way to satisfy.
- **`local/no-nested-object-value`**: `**/*.schema.ts` is a config file by default (zod, yup, valibot
  schemas are settings literals, like a decorator argument).
- **`local/type-placement`**: an `import type` from a `common` barrel (`../common`, `./common/index.ts`,
  `@shared/common`) passes; `state.type.ts` files (any prefix) are exempt.
- **TypeScript**: `@typescript-eslint/parameter-properties` is off for `**/*.action.ts`; class actions
  carry their payload as constructor parameter properties.
- **Base**: the `max-lines` block no longer claims `**/*.html`. Without the `angularTemplate` preset
  every HTML file in scope was parsed as JavaScript and reported a fatal parsing error; the template
  preset now carries the same 150-line limit for HTML.

## [1.6.3] - 2026-09-05

### Features

- **Angular templates**: new rule `lint-suite-angular-template/no-unstyled-classes` (enabled in the
  `angularTemplate` preset): reports a class used in a template that no stylesheet of that component selects.
  It reads `class="a b"` tokens, `[class.name]` bindings, and the literal class names inside `[class]="..."`
  expressions and `class="a {{ b }}"` interpolations; `[ngClass]` is not analysed. Stylesheets come from
  `styleUrl`/`styleUrls`/`styles` in the `@Component` metadata, a sibling `.scss`/`.css` file, or a
  `<link rel="stylesheet" href="...">` in the template itself (relative hrefs only, so a plain HTML page
  without a component is judged against the stylesheets it links), and are parsed with `postcss-scss`, so `&` nesting, `@media` blocks, selector lists, and `@use`/`@import`/`@forward`
  partials all resolve. Options: `ignoreClassPatterns` (default `['^(js|qa|mat|cdk|mdc)-']`) and `globalStyles`
  (default `[]`). Custom elements are skipped, and a template with no parseable stylesheet reports nothing.
- **Stylelint**: new rule `lint-suite/no-unused-classes` (enabled in the `stylelint` preset): reports a class
  selector in a component stylesheet that no template of that component uses. Templates come from the
  `@Component` metadata beside the stylesheet (`styleUrl`/`styleUrls` match, then `templateUrl` or the inline
  `template` literal), a sibling `.html` file, or any `.html` file under the working directory that links the
  stylesheet with `<link rel="stylesheet" href="...">`, and a stylesheet shared by several components is judged
  against all of their templates. Selectors are parsed with `postcss-scss`, so `&` nesting, `@media` blocks,
  and selector lists resolve and each name is reported on the rule that declares it; `:host(...)` /
  `:host-context(...)` arguments and everything after `::ng-deep` are skipped, interpolated selectors are
  never reported, and `@extend .base` counts `base` as used. Unlike the ESLint dual it also reads `[ngClass]`
  and does not skip custom elements. Option: `ignoreClassPatterns` (default `['^(js|qa|mat|cdk|mdc)-']`).
  A stylesheet with no template, or one whose template holds a class source the rule cannot read
  (`[class]="expr()"`, `{{ expr }}` as a whole token), reports nothing.
- **TypeScript**: new autofixable rule `local/one-line-guard` (enabled in the `typescript` preset with
  `maxLineLength` = the preset print width, 135): a lone `return`/`throw`/`continue`/`break` guard drops its
  braces when the whole `if` fits on one line.

### Changed

- **Performance**: `no-unstyled-classes`, `no-unused-classes`, and `no-unused-instance-fields` now share one
  mtime-keyed file cache for parsed `@Component` metadata, stylesheets, and templates, so a lint run only
  re-parses a file that changed on disk. `no-unstyled-classes` also keeps the merged class set of a template's
  stylesheet chain and only rebuilds it when one of those files changes; `no-unused-classes` caches directory
  listings by directory mtime. Freshness is unchanged: every lint still stats each file it reads.
- **Performance**: parsed `@Component` metadata, stylesheet class entries, template class usage, and template
  stylesheet links are also mirrored to disk in `node_modules/.cache/lint-suite/*.json` (keyed by path, mtime, and
  size), so a fresh ESLint or stylelint process, a CI run, or an editor's first lint skips every parse of a file
  that did not change since the last run. `LINT_SUITE_CACHE_DIR` moves the directory; `LINT_SUITE_CACHE=0`
  disables the disk copy (the in-memory cache stays).
- **Performance** (`no-unused-instance-fields`, project analysis): the project index is now incremental per edit
  instead of per session. Reads of `this.member` and of a lone template `member` that the class declares itself
  resolve syntactically (the type checker is only asked for inherited, indexed, or chained reads); a newly seen
  member name re-indexes only files that read that exact name (was: any file whose text contained it as a
  substring); the directive index is rebuilt only when a selector actually changes; per-lint bookkeeping no longer
  rebuilds the usage set or path-normalizes every dependency. Templates are parsed without whitespace and trivia
  spans. On a synthetic 10k-file project (3,300 components): first-open index build 10.2s → 6.6s, cost added per
  editor save 106ms → 7ms, and adding a field or a component no longer triggers a full re-index. Freshness: the
  templates of the linted file and of every component in its folder are checked on every lint; templates in
  other folders are checked on the existing throttled schedule (100× the duration of the last check).

## [1.6.2] - 2026-09-04

### Changed

- **Internal**: the class-usage helpers shared by `no-unstyled-classes` and `no-unused-classes` (component
  metadata reading, template class collection, class-expression literals, selector class resolution, resolved
  rule walking) moved to `src/lib/rules/common/`. No public API change.
- **Angular**: `lint-suite-angular/no-unused-instance-fields` project analysis now keeps an incremental
  per-tsconfig index instead of rebuilding the whole project index whenever the TypeScript Program changes.
  In editors every save produces a new Program; only the saved file and the files whose reads depended on it
  are re-indexed, so lint feedback after a save drops from seconds to milliseconds (300-component benchmark:
  2.5 s → 0.05 s per save). Full lints are faster too: template reads are resolved with `@angular/compiler`
  directly instead of running a whole-program `@angular/compiler-cli` analysis (rule time 4.0 s → 2.4 s on
  the same project). Template references (`#ref`, `#ref="exportAs"`) resolve within a standalone component's
  `imports` when those resolve to Program classes, and against every matching component or directive in the
  Program otherwise (NgModule scopes, `hostDirectives`); extra candidates can only add reads, never reports.
  See `packages/lint-suite/benchmarks/` to reproduce.
- **Angular**: `lint-suite-angular/no-unused-instance-fields` project analysis reads `template`, `templateUrl`,
  `selector`, and `exportAs` given as string constants (local or imported) through the type checker instead of
  failing closed on anything but a literal.
- **Angular**: `lint-suite-angular/no-unused-instance-fields` project analysis no longer goes silent for the
  whole project when one file cannot be indexed. Such a file falls back to name matching (every member whose
  name it mentions counts as read); set `LINT_SUITE_DEBUG=1` to see which files fell back and why.

### Bug Fixes

- **Dependencies**: Dropped `@angular/compiler-cli`; project analysis only needs `@angular/compiler`.

## [1.6.1] - 2026-09-02

### Breaking Changes

- **Angular**: The `angular` preset now requires typed parser services (`projectService: true`) and runs
  `lint-suite-angular/no-unused-instance-fields` in project mode. It recognizes exact reads in the configured
  TypeScript/Angular Program, including external parent templates/TypeScript, subclasses, and Angular interface
  implementations. Project mode now reports unused public/protected directive members. Direct rule usage remains
  local by default, and `allowEffectFields` remains opt-in. After cross-file or template changes, do not use
  ESLint `--cache` for correctness gates; run a full non-cached lint.

### Changed

- **TypeScript**: `local/explicit-accessibility` auto-fix now inserts `public` by default (was `private`); `defaultAccessibility` still configures it (new value `'none'` reports without an auto-fix), and IDE suggestions offer the remaining levels.
- **TypeScript**: The `typescript` preset no longer enables `@typescript-eslint/explicit-member-accessibility` alongside `local/explicit-accessibility`; every missing modifier was reported twice.
- **Angular**: `lint-suite-angular/no-unused-instance-fields` project analysis reuses the ESLint program's parsed source files for the Angular compiler and checks external template freshness at an amortized rate instead of once per linted file, cutting project-mode overhead by roughly two thirds.

### Features

- **Angular**: Extended `lint-suite-angular/no-unused-instance-fields` with optional project-wide TypeScript and Angular template usage analysis, auto-cleaned effect handling, and signal query recognition.
- **TypeScript**: Added `local/readonly-type-properties`, an auto-fixable rule reporting primitive-typed `type`, interface, and inline object type properties that are not marked `readonly`; array-, object-, and reference-typed properties are left untouched. Enabled in the `typescript` preset.
- **TypeScript**: Added `local/no-inline-object-types`, reporting object type literals nested inside a `type` alias declaration (only the alias's direct body may be an object literal). Enabled in the `typescript` preset.

### Bug Fixes

- **Dependencies**: Added `@angular/compiler-cli` and pinned `@angular/compiler` for Angular project analysis.
- **Angular**: `lint-suite-angular/no-unused-instance-fields` local analysis no longer reports non-private members of `abstract` components/directives, nor `ControlValueAccessor`/`Validator`/`AsyncValidator` methods on classes that implement them.
- **TypeScript**: `local/explicit-accessibility` no longer fixes constructors to `private`, no longer reports `#private` members, no longer inserts a doubled space before fixed methods, and now reports abstract and `accessor` members.
- **Angular**: Excluded fields typed with Angular's `ComponentRef` from `no-unused-instance-fields` reports without exempting unrelated same-named local types.

## [1.6.0] - 2026-08-30

### Features

- **Angular**: Added `lint-suite-angular/no-unused-instance-fields` to report unused component and directive fields and methods while recognizing reads from TypeScript, templates, and host expressions.

### Bug Fixes

- **TypeScript**: Corrected the test-file override id `@typescript-eslint/no-unbound-method` → `@typescript-eslint/unbound-method`. The mistyped (non-existent) id meant `unbound-method` was never actually disabled in `*.spec` / `*.test` / `*.e2e` files.
- **Dependencies**: Updated compatible Angular, Nx, ESLint, TypeScript ESLint, test, and Stylelint dependencies and regenerated the lockfile to remove known transitive vulnerabilities.

## [1.5.0] - 2026-07-16

### Breaking Changes

- **Angular**: Upgraded `angular-eslint` ^21.4.0 → ^22.1.0 (Angular 22, TypeScript 6, ESLint 9+ flat config only). Removed the `no-conflicting-lifecycle` rule from the `angular` config — the rule was deleted upstream in v22. `prefer-on-push-component-change-detection` changed semantics: it now reports only components that explicitly opt out of OnPush (omitting `changeDetection` means OnPush in Angular v22).
- **Boundaries**: Upgraded `eslint-plugin-boundaries` 6.0.2 → 7.0.2 and migrated the config to the v7 entity model: `rules` option renamed to `policies`, flat element selectors wrapped as entity selectors (`from: { element: { type: ... } }`), and the custom message migrated from the legacy `${...}` to the `{{...}}` template syntax (`{{to.element.types}}` / `{{from.element.types}}`). Report behavior is unchanged; default report messages from the plugin now include entity information, so exact-string assertions may need re-recording.
- **JSON**: Upgraded `@eslint/json` ^1.2.0 → ^2.0.1.

### Bug Fixes

- **Stylelint**: Added an empty top-level `rules: {}` to the shared `stylelint` config. Stylelint 17 resolves the configuration for the working directory when picking a formatter, and an overrides-only config failed there with `ConfigurationError: No rules found within configuration`.
- **Dependencies**: Migrated the workspace to Nx 23.1 and bumped `@nx/eslint-plugin` 22.7.3 → 23.1.0, `typescript-eslint` and `@typescript-eslint/utils` 8.59.4 → 8.64.0, `@vitest/eslint-plugin` 1.6.18 → 1.6.23, `eslint-import-resolver-typescript` 4.4.4 → 4.4.5, `eslint-plugin-import-x` 4.16.2 → 4.17.1, `eslint-plugin-playwright` 2.10.4 → 2.10.5, `eslint-plugin-storybook` 10.4.1 → 10.5.2, `globals` 17.6.0 → 17.7.0, `stylelint` 17.12.0 → 17.14.0, and `stylelint-scss` 7.1.1 → 7.2.0.
- **Workspace**: Migrated to pnpm 11.13.1 — the removed `onlyBuiltDependencies` setting was replaced with `allowBuilds` in `pnpm-workspace.yaml`. Adopted the TypeScript 6 defaults by dropping the `ignoreDeprecations`/`esModuleInterop: false`/`types: ["*"]`/`noUncheckedSideEffectImports: false` pins the Nx migration had written into the tsconfigs (`module: nodenext` already implies `esModuleInterop`). Fixed `nx.json` `defaultBase` from `main` to the actual `master` branch. CI/release workflows: pnpm 10.33.0 → 11.13.1, `actions/checkout` v4 → v7.0.0, `actions/setup-node` v4 → v7.0.0, `pnpm/action-setup` v6.0.3 → v6.0.9 (all SHA-pinned).

## [1.4.0] - 2026-06-16

### Features

- **Stylelint**: Added a shared `stylelint` config as a named export on subpath `lint-suite/stylelint` (`import { stylelint } from 'lint-suite/stylelint'`) for SCSS — extends `stylelint-config-standard`, `stylelint-config-standard-scss`, `stylelint-config-recess-order` with BEM selector enforcement, scoped to `**/*.scss`.
- **Prettier**: Added a shared `prettier` config as a named export on subpath `lint-suite/prettier` (`import { prettier } from 'lint-suite/prettier'`) with the suite's house formatting defaults and Angular/HTML template overrides.

### Breaking Changes

- **ESLint**: Moved all ESLint configs to the `lint-suite/eslint` subpath; the root `lint-suite` import no longer exports them. Update imports to `import { recommended } from 'lint-suite/eslint'`.
- **Jest**: Removed the `jest` config module and the `eslint-plugin-jest` dependency. The `jest` export is gone and `recommended` no longer applies Jest rules to `**/*.spec.{ts,js}`. Consumers relying on Jest linting should use the `vitest` config or pin `lint-suite@1.3.11`.

## [1.3.11] - 2026-05-25

### Features

- **Angular**: Downgraded `no-developer-preview` and `no-experimental` from `error` to `warn` so consumers can adopt Angular preview/experimental APIs without disabling the rules.

### Bug Fixes

- **Boundaries**: Migrated config to `eslint-plugin-boundaries` v6. Renamed `boundaries/element-types` to `boundaries/dependencies` and converted legacy string selectors to object-based form (`from: { type: ... }`, `allow: [{ to: { type: ... } }]`). Silences the v5→v6 deprecation warnings.
- **Dependencies**: Bumped `@nx/eslint-plugin` 22.7.1 → 22.7.3, `@typescript-eslint/utils` and `typescript-eslint` 8.59.2 → 8.59.4, `@vitest/eslint-plugin` 1.6.16 → 1.6.18, `eslint-plugin-playwright` 2.10.2 → 2.10.4, `eslint-plugin-storybook` 10.3.6 → 10.4.1, `angular-eslint` ^21.3.1 → ^21.4.0, and `eslint` ^10.3.0 → ^10.4.0.

## [1.3.10] - 2026-05-07

### Breaking Changes

- **JSON**: Replaced `eslint-plugin-json` with the official `@eslint/json` plugin. `eslint-plugin-json@4` is incompatible with ESLint 10 (uses removed `context.getFilename()` API). Consumers using the `json` config module continue to get `**/*.json` and `**/tsconfig*.json` / `**/.vscode/*.json` (JSONC) coverage, now via `language: 'json/json'` and `language: 'json/jsonc'`.

## [1.3.9] - 2026-05-07

### Bug Fixes

- **Dependencies**: Declared `@eslint/js` as a runtime dependency. `@nx/eslint-plugin` requires it via `require('@eslint/js')` without declaring it itself, so consumers were crashing with `Cannot find module '@eslint/js'` whenever `@eslint/js` was not transitively hoisted from elsewhere.

## [1.3.8] - 2026-05-06

### Features

- **Angular**: Added new rules for safer components — `computed-must-return`, `no-conflicting-lifecycle`, `no-duplicates-in-metadata-arrays`, `no-lifecycle-call`, `require-lifecycle-on-prototype`, `relative-url-prefix`, `use-component-selector`, `no-developer-preview`, and `no-experimental`.
- **Angular Templates**: Added `no-non-null-assertion` to forbid `!` assertions in templates and `no-inline-styles` to forbid inline `style="..."` attributes.

### Bug Fixes

- **TypeScript**: Fixed `explicit-member-accessibility` autofix inserting accessibility modifiers in the wrong position in some cases.

## [1.3.7] - 2026-03-30

### Bug Fixes

- **Imports**: Fixed import resolver failing to find `tsconfig` in consuming projects — resolver now auto-discovers tsconfig files instead of requiring a hardcoded path

## [1.3.4] - 2026-03-30

### Bug Fixes

- **Imports**: Fixed import resolver failing to find `tsconfig` in consuming projects when using `eslint-import-resolver-typescript`

## [1.3.2] - 2026-02-14

### Improvements

- **TypeScript**: Relaxed `@typescript-eslint/no-confusing-void-expression` — enabled `ignoreArrowShorthand` and `ignoreVoidOperator` options to allow common patterns like `() => void doSomething()` and shorthand arrow returns

## 1.3.1 (2026-02-14)

### Improvements

- **RxJS**: Disabled `rxjs/no-subscribe-handlers` in test files — subscribe handlers are acceptable in tests
- **TypeScript**: Disabled `@typescript-eslint/no-extraneous-class` in `.action.ts` files — NgRx action classes are intentionally empty

### Removed

- **Boundaries**: Removed `boundaries/no-unknown` rule — too noisy for most projects
- **Vitest**: Removed `vitest/no-conditional-in-test` — overly strict for real-world test scenarios

## 1.3.0 (2026-02-13)

### Features

- **Prettier**: Added new `prettier` configuration module using `eslint-config-prettier` to disable formatting rules that conflict with Prettier. Must be last in the configuration array.
- **Angular Templates**: Added Angular 21+ control flow rules (`prefer-at-else`, `prefer-at-empty`, `prefer-contextual-for-variables`, `no-empty-control-flow`).
- **Angular Templates**: Added performance rules (`prefer-class-binding`, `prefer-static-string-properties`, `no-call-expression`, `conditional-complexity`).
- **Angular**: Added Angular 21.2.0 rules (`no-implicit-take-until-destroyed`, `no-async-lifecycle-method`, `prefer-output-readonly`, `prefer-output-emitter-ref`, `sort-lifecycle-methods`).
- **TypeScript**: Added v8 type-safety replacements for deprecated `ban-types` (`no-empty-object-type`, `no-unsafe-function-type`, `no-wrapper-object-types`).
- **TypeScript**: Added strict type-checked rules (`no-unnecessary-condition`, `no-confusing-void-expression`, `no-dynamic-delete`, `no-extraneous-class`, `no-invalid-void-type`, `unified-signatures`, `no-non-null-asserted-nullish-coalescing`).
- **TypeScript**: Added stylistic type-checked rules (`prefer-find`, `prefer-for-of`, `prefer-includes`, `prefer-string-starts-ends-with`, `prefer-regexp-exec`).
- **TypeScript**: Replaced deprecated rules — `no-var-requires` → `no-require-imports`, `no-throw-literal` → `only-throw-error`.
- **TypeScript**: Added `no-array-delete` and `return-await` (in-try-catch) for safer code patterns.
- **Imports**: Added `no-self-import`, `no-cycle` (max depth 2), `consistent-type-specifier-style`, and `no-anonymous-default-export`.
- **Imports**: Enhanced `no-useless-path-segments` with `noUselessIndex` option.
- **Jest**: Overhauled configuration — switched from `flat/all` to `flat/recommended` with curated best-practice rules (`consistent-test-it`, `prefer-comparison-matcher`, `prefer-hooks-on-top`, `no-conditional-in-test`, and more).
- **Vitest**: Expanded rule set with matcher improvements, test quality rules, and `prefer-mock-promise-shorthand`.
- **Playwright**: Expanded rule set with locator best practices (`prefer-locator`, `prefer-native-locators`), matcher improvements, and test structure rules.
- **RxJS**: Added `no-exposed-subjects`, `no-cyclic-action`, and `no-subscribe-handlers` for better observable hygiene.
- **Storybook**: Added `csf-component` and `no-stories-of` rules to enforce modern CSF patterns.
- **Boundaries**: Added `no-unknown` and `no-unknown-files` warnings for uncategorized imports/files.
- **JSON**: Added `recommended-with-comments` config for `tsconfig*.json` and `.vscode/*.json` files.
- **Base**: Added `no-useless-assignment` (ESLint v9) and `no-object-constructor` rules.

### Breaking Changes

- **Jest**: Changed from `flat/all` to `flat/recommended` as the base preset. Projects relying on rules from `flat/all` that are not explicitly re-enabled may see rules disappear. Review the curated rule list if migrating.
- **Base**: Removed `no-return-await` (replaced by TypeScript-aware `@typescript-eslint/return-await`).
- **TypeScript**: `no-var-requires` replaced by `no-require-imports`; `no-throw-literal` replaced by `only-throw-error`.

## 1.2.3 (2025-12-25)

### Bug Fixes

- **Imports**: Resolved `import-x/order` configuration issue where internal aliases were misclassified as external packages.
- **Imports**: Updated `pathGroupsExcludedImportTypes` to strictly exclude `builtin` modules, ensuring correct sorting for internal path aliases.

## 1.2.0 (2025-12-25)

### Features

- **Angular**: Added support for Angular 19+ Signal inputs (`prefer-signal-model`).
- **Angular**: Enforced explicit signal invocation in templates (`no-uncalled-signals`).
- **Angular**: Updated host binding preference to `host` property (`prefer-host-metadata-property`).
- **Angular Templates**: Added comprehensive formatting and performance rules (`prefer-empty-for`, `no-call-expression`, `prefer-built-in-pipes`).
- **Imports**: Enhanced `sort-imports` and `import/order` configuration for better grouping ensuring local and external libraries are properly separated.
- **Boundaries**: Integrated `eslint-plugin-boundaries` to enforce architecture rules (feature, data-access, ui, domain-logic, etc.).

### Improvements

- **General**: Configured `max-lines-per-function` to ignore comments and blank lines, providing a more accurate complexity metric.

## 10.10.1 (2025-10-23)

- Added playwright and vitest plugins

## 1.0.8 (2025-05-12)

- Updated dependencies to latest versions

## 1.0.7 (2025-05-12)

- Added strict typescript support
- Added angular 20 rules

## 1.0.4 (2025-04-02)

- Removed unnecessary Prettier plugin from the base configuration, NX handles that

## 1.0.3 (2025-04-02)

- Fixed rxjs plugin

## 1.0.2 (2025-04-02)

- Fixed the parser issues
- Added new @stylistic support for prettier

## 1.0.1 (2025-03-31)

- Updated README.md to have badges

## 1.0.0 (2025-03-31)

### Features

#### Base Configuration

- Added flat ESLint configuration support
- Integrated stylistic plugin for consistent code formatting
- Configured import plugin with recommended settings
- Set maximum line length to 135 characters
- Limited file size to 150 lines (300 for test files)
- Implemented structured comment formatting
- Configured comma dangle rules for different contexts
- Set up proper indentation with special handling for complex cases
- Added import sorting with configurable groups
- Enforced class-methods-use-this rule

#### TypeScript Configuration

- Configured TypeScript-specific rules from @typescript-eslint
- Added explicit member accessibility requirement
- Enforced consistent type imports
- Added warnings for missing function return types
- Implemented readonly property enforcement
- Prohibited empty functions
- Added special configurations for action files (allowing multiple classes)
- Configured state files to bypass class-methods-use-this rule
- Added relaxed rules for spec files

#### Angular Configuration

- Integrated @nx/eslint-plugin angular configurations
- Enforced OnPush change detection strategy

#### Angular Template Configuration

- Comprehensive accessibility rules for templates
- Button type requirements
- Tabindex validation
- ARIA attribute validation
- Alt text requirements
- Proper element content validation
- Keyboard event handling alongside mouse events
- Table scope enforcement
- Autofocus prevention
- Removal of distracting elements
- Modern control flow syntax preference
- Self-closing tags standardization
- ngSrc usage recommendation
- Structured attributes ordering with customizable configuration

#### RxJS Configuration

- Integrated @smarttools/eslint-plugin-rxjs
- Set up Observer pattern usage enforcement
- Configured Finnish notation warnings
- Implemented error handling rules
- Added unsafe operator prevention (switchMap, takeUntil, catch, first)
- Prohibited toPromise() usage
- Enforced proper error throwing patterns
- Relaxed subscription rules for test files

#### Testing Support

- Integrated Jest plugin with recommended and style configurations
- Disabled done callback restriction

#### Additional Features

- Added JSON file linting via eslint-plugin-json
- Configured Storybook support
- Created specialized module declaration files for plugins

### Documentation

- Added detailed type definitions for eslint plugins
- Provided comprehensive configuration examples

[Unreleased]: https://github.com/F0rty-Tw0/lint-suite/compare/v2.0.0...HEAD
[1.3.4]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.3.2...v1.3.4
[2.0.0]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.6.3...v2.0.0
[1.6.3]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.3.11...v1.4.0
[1.3.11]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.3.11...v1.3.11
[1.3.10]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.3.9...v1.3.10
[1.3.9]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.3.8...v1.3.9
[1.3.8]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.3.7...v1.3.8
[1.3.7]: https://github.com/F0rty-Tw0/lint-suite/compare/v1.3.4...v1.3.7
