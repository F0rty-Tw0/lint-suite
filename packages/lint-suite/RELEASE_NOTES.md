# Lint Suite Release Notes

## Unreleased

### Workspace project boundaries

The `boundaries` config, and so `recommended`, now enables
`modular-boundaries/modular-boundaries` from
`@lint-suite/eslint-plugin-modular-boundaries`. It reads pnpm, npm, Nx,
Turborepo and moon workspace files and checks imports between workspace
projects. Outside a workspace it does nothing. Breaking changes:

- A project tagged `type:lib` or `type:app` that imports a project tagged
  `type:app` is reported (`notTagsConstraintViolation`). Apps are leaves:
  move code another project needs into a `type:lib` project. Untagged
  projects are unconstrained. Tags come from `project.json` `tags`,
  `package.json` `nx.tags`, or a top-level `package.json` `tags` array.
- An import that closes a cycle between workspace projects is reported
  (`noCircularDependencies`).
- In a project with its own `package.json`, an npm or workspace package that
  the manifest does not declare is reported (`undeclaredDependency`). This
  includes tooling installed only at the workspace root, such as `vitest`
  imported from a package's spec files. Migration: declare it in that
  package's `devDependencies`, or set `checkUndeclaredDependencies: false`.
- A relative import into another project, or a project importing itself by
  package name or path alias, is reported.

To change the constraints or turn a check off, set the rule again in a later
config entry. ESLint replaces the options rather than merging them, so repeat
the `depConstraints` you want to keep:

```js
import { recommended } from 'lint-suite/eslint';

export default [
  ...recommended,
  {
    rules: {
      'modular-boundaries/modular-boundaries': [
        'error',
        {
          depConstraints: [
            { sourceTag: 'type:lib', notDependOnLibsWithTags: ['type:app'] },
            { sourceTag: 'type:app', notDependOnLibsWithTags: ['type:app'] },
            { sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }
          ],
          checkUndeclaredDependencies: false
        }
      ]
    }
  }
];
```

Do not register `@lint-suite/eslint-plugin-modular-boundaries` under the
`modular-boundaries` key yourself alongside the umbrella; reconfigure the
umbrella's rule as above.

### Drop @nx/eslint-plugin dependency

`lint-suite` no longer depends on `@nx/eslint-plugin`, so installs no longer
pull in `nx`, `@nx/*` and their Babel tree. The `javascript` and `typescript`
presets are rebuilt on `@eslint/js` and `typescript-eslint` recommended,
without the legacy parser options and rule overrides that came from the Nx
configs. Breaking changes:

- The `@nx` plugin is no longer registered, so `@nx/*` rules fail with
  "Could not find plugin @nx". Migration: install `@nx/eslint-plugin` and add
  `{ extends: [...configs['flat/base']] }` (with
  `import { configs } from '@nx/eslint-plugin'`) and no `files` key.
  `plugins: { '@nx': nxPlugin }` works at runtime but fails typecheck.
- Composing `base`, `javascript` or `typescript` without `prettier` now reports
  formatting-related rules (`@stylistic/*` plus core `curly`, `max-len` and
  `no-unexpected-multiline`) that `eslint-config-prettier` used to turn off.
  `recommended` is unaffected. Migration: append `prettier` to your config.
- The default `parserOptions.tsconfigRootDir` for TS files is now
  `process.cwd()` instead of the Nx workspace root, which was found by walking
  up to `nx.json` (or the highest directory with `node_modules/nx`) or read
  from `NX_WORKSPACE_ROOT_PATH`. Anyone who runs ESLint from a subdirectory of
  their repo root, most commonly Nx lint targets with `cwd: {projectRoot}`,
  now resolves tsconfig lookup and relative `project` or `allowDefaultProject`
  paths from that subdirectory. `process.cwd()` is read once when the config
  loads, so a long-lived ESLint process such as an editor server keeps its
  first working directory. Migration: set
  `parserOptions.tsconfigRootDir: import.meta.dirname` in your config, which
  avoids both.
- JS files now report 18 core bug rules that were turned off for them
  (`no-undef`, `no-dupe-keys`, `no-const-assign`, `no-unreachable` and
  others). Most likely hit: `no-undef` for globals the config doesn't know,
  such as test-runner globals in `.js` specs or custom browser globals.
  Migration: add them to `languageOptions.globals`.
- JS files no longer get `@typescript-eslint/*` rules (including
  `ban-ts-comment`, `no-this-alias` and `triple-slash-reference`). They are
  still parsed by `@typescript-eslint/parser`, so your own
  `@typescript-eslint/*` rules set without `files` keep running on JS without
  crashing. Core `no-unused-vars`, `no-unused-expressions`,
  `no-array-constructor` and `no-empty-function` replace their
  typescript-eslint versions; `no-unused-vars` is now `error` (was `warn`).
  Migrations:
  - rename `eslint-disable` comments for these four rules in JS files to the
    core rule name (`--fix` removes the now-unused ones; they warn as unused
    directives otherwise);
  - options set on the typescript-eslint versions without `files` (for
    example `no-unused-vars` `argsIgnorePattern`) no longer reach JS files:
    set the same options on the core rule for JS files, or turn the core rule
    off there if you re-enable the typescript-eslint one (otherwise each
    finding is reported twice).
- `ecmaVersion` is now `latest` (was 2020) for JS and TS files, and `.cjs`
  files get CommonJS scoping (top-level declarations are module-local)
  instead of being parsed as ES modules. No migration expected.
- TS: `@typescript-eslint/no-empty-interface` is no longer set;
  `@typescript-eslint/no-empty-object-type` (already on) covers it.

### Dependency updates

- `angular-eslint` 22.5.0, `typescript-eslint` 8.71.1, `globals` 17.13.0,
  `@eslint/json` 2.1.1, `eslint-plugin-playwright` 2.12.1,
  `eslint-plugin-storybook` 10.6.1, `stylelint` 17.16.0 and `stylelint-scss`
  7.3.0.
- `playwright`: `playwright/no-identical-title` now warns, from
  `eslint-plugin-playwright` 2.12's `flat/recommended`. Duplicate test or
  describe titles in one file are reported; `--max-warnings=0` gates fail.
- New upstream rules enabled at `error` (breaking: new findings):
  - `typescript`: `@typescript-eslint/no-generated-empty-object-type` and
    `@typescript-eslint/no-unsafe-enum-assignment` (both type-aware).
  - `angular`: `@angular-eslint/reactive-context-must-read-signal`.
    `computed()`, `linkedSignal()` or `effect()` that reads no signal.
  - `angularTemplate`: `@angular-eslint/template/prefer-style-binding`.
    `[style]` instead of `ngStyle`.
  - `playwright`: `no-export`, `no-test-return-statement`,
    `no-template-literal-title`, `prefer-ending-with-an-expect`,
    `require-annotation-reason`, `no-action-timeout` and
    `no-magic-timeouts`.
  - `lint-suite/stylelint`: `selector-no-unmatchable`.
- The ESLint peer range stays `^10.9.1`. TypeScript stays on 6.x:
  `typescript-eslint` and Angular do not support TypeScript 7 yet.

## v2.2.0: unread Angular inputs, outputs, and queries

- **Breaking:** `lint-suite-angular/no-unused-instance-fields` now reports
  unread inputs, outputs, and queries: signal `input()`, `input.required()`,
  `model()`, `output()`, `viewChild()`, `viewChildren()`, `contentChild()`,
  `contentChildren()`, and decorated `@Input()`, `@ViewChild()`,
  `@ViewChildren()`, `@ContentChild()`, `@ContentChildren()` fields, plus
  `@Output()` fields initialized with `new EventEmitter()`. A field counts as
  unused when its class, template, and host metadata never read it; parent
  bindings do not count. `outputFromObservable()` fields, `@Output()` fields
  backed by other observables, decorated setters, and inputs of classes that
  declare `ngOnChanges` stay exempt.
- New `allowRxjsInteropFields` option allows unread fields holding
  `@angular/core/rxjs-interop` calls (`toSignal`, `toObservable`,
  `outputToObservable`, `rxResource`).

## v2.1.1: independently installable custom rules

- Extracted all 21 custom rules into `@lint-suite/eslint-plugin-*` and
  `@lint-suite/stylelint-no-unused-classes` packages. Each can be installed
  without the umbrella's unrelated presets and dependencies.
- Kept all `lint-suite/eslint`, `lint-suite/stylelint`, and
  `lint-suite/prettier` entrypoints and existing umbrella rule IDs, severities,
  options, and parser behavior.
- Isolated template and Stylelint disk caches by the owning public package
  name and version. Both plugins can share `LINT_SUITE_CACHE_DIR` safely.
- Replaced workspace-wide release versioning with affected-only independent
  Nx releases. The umbrella adopts exact newly released rule versions.

Existing umbrella consumers need no configuration changes. Standalone
consumers configure their parser and enable the package's single rule
explicitly; see the package README for project-aware rules.

## v1.3.2

Patch release relaxing the `no-confusing-void-expression` rule for better developer experience.

### Changes

- **TypeScript**: `@typescript-eslint/no-confusing-void-expression` now allows arrow shorthand (`ignoreArrowShorthand: true`) and void operator (`ignoreVoidOperator: true`) — common patterns like `() => void doSomething()` and `() => someVoidFn()` no longer trigger errors

---

## v1.3.1

Patch release with rule adjustments based on real-world usage feedback.

### Changes

- **RxJS**: `rxjs/no-subscribe-handlers` is now `off` in test files — subscribe handlers are common and acceptable in tests
- **TypeScript**: `@typescript-eslint/no-extraneous-class` is now `off` in `.action.ts` files — NgRx action classes are intentionally empty
- **Boundaries**: Removed `boundaries/no-unknown` — produced too much noise on real projects
- **Vitest**: Removed `vitest/no-conditional-in-test` — overly strict for real-world test scenarios

---

## v1.3.0

This release is a comprehensive expansion of lint-suite, adding **60+ new rules** across all configuration modules, a new Prettier integration module, and modernized presets for Angular 21, TypeScript-ESLint v8, and testing frameworks.

### Highlights

- New **Prettier** configuration module for seamless formatter integration
- **Angular 21+** control flow and performance rules
- **TypeScript-ESLint v8** strict and stylistic type-checked rules
- Overhauled **Jest** configuration with curated best-practice rules
- Expanded **Vitest**, **Playwright**, and **RxJS** rule sets
- **Circular dependency detection** via `import-x/no-cycle`
- **JSON comment support** for tsconfig and VS Code settings files

---

## Key Features

### Prettier Integration (NEW)

- Disables all ESLint formatting rules that conflict with Prettier
- Must be placed last in the configuration array (handled automatically by `recommended`)
- Zero-config — just include it and Prettier takes over formatting

### TypeScript Rules

- Enforces explicit member accessibility for better code readability
- Requires consistent type imports to standardize import styles
- Warns on missing function return types for improved type safety
- Enforces readonly properties where appropriate
- **v8 type-safety**: Bans confusing `{}`, `Function`, and wrapper object types (`Number`, `String`, `Boolean`)
- **Strict type-checked**: Catches always-true/false conditions, confusing void expressions, dynamic deletes, and unnecessary non-null assertions
- **Stylistic type-checked**: Enforces `find()` over `filter()[0]`, `includes()` over `indexOf()`, modern string methods, and `for-of` loops
- **Deprecated rule replacements**: `no-require-imports` (was `no-var-requires`), `only-throw-error` (was `no-throw-literal`)
- **Safer patterns**: Prevents `delete arr[0]`, enforces `return await` in try/catch for better stack traces
- Special configurations for action, state, and spec files

### Angular Rules

- Enforces OnPush change detection strategy for better performance
- Signal-based component patterns enforcement (`prefer-signals`, `prefer-signal-model`)
- **Angular 21.2.0**: Enforces explicit `DestroyRef` usage (`no-implicit-take-until-destroyed`)
- **Angular 21.2.0**: Prefers `[class]` binding over `ngClass` (`prefer-class-binding`)
- Prevents async lifecycle hooks and enforces lifecycle method ordering
- Modern output patterns (`prefer-output-emitter-ref`, `prefer-output-readonly`)
- Comprehensive template accessibility rules with structured attribute ordering

### Angular Template Rules

- **Modern control flow**: `@if/@else` syntax, `@for/@empty` syntax, contextual `$index`/`$first` variables
- **Performance**: Prefers class bindings, static string properties, warns on template method calls
- **Readability**: Limits conditional complexity to 5, catches incomplete control flow refactoring
- Full accessibility suite (ARIA, alt text, keyboard events, semantic HTML)

### RxJS Rules

- Finnish notation warnings for Observable naming conventions
- Prevents unsafe operators usage (switchMap, takeUntil, catch, first)
- **Subject encapsulation**: Enforces hiding subjects behind observables (`no-exposed-subjects`)
- **NgRx safety**: Prevents infinite loops in effects (`no-cyclic-action`)
- **Observer pattern**: Prefers observer objects over subscribe handlers
- Ensures Observer pattern usage

### Import Organization

- Sophisticated grouping with Angular/NestJS at top, internal paths grouped correctly
- **Circular dependency detection** with configurable max depth
- **Self-import prevention** for cleaner module graphs
- **Consistent type specifier style** (prefer top-level)
- **No anonymous default exports** for better code searchability

### Testing Support

- **Jest**: Curated best-practice rules — consistent `it()` usage, comparison/equality matchers, hooks on top, no conditionals in tests, strict equality preferences
- **Vitest**: Expanded with matcher improvements, spy preferences, parameterized test encouragement, and mock promise shorthand
- **Playwright**: Locator best practices (`prefer-locator`, `prefer-native-locators`), matcher improvements, hooks on top, top-level describe requirement
- Relaxed rules for test files where appropriate

### Code Style & Structure

- Maximum line length (135 characters)
- Maximum file size (150 lines, 300 for test files)
- Consistent comment formatting
- Standardized comma dangle rules
- Catches unused assignments (ESLint v9) and disallows `new Object()`

### Additional Features

- Enforced Module Boundaries with warnings for uncategorized files
- JSON file linting with comment support for tsconfig and VS Code settings
- Storybook CSF enforcement (component property required, deprecated `storiesOf` banned)
- Base JavaScript configurations

## Benefits

- Improved code consistency across projects
- Enhanced accessibility compliance
- Better performance through enforced best practices
- Reduced technical debt
- Streamlined developer experience
- Seamless Prettier integration

## Getting Started

Install the package and extend your ESLint configuration:

```js
import { recommended } from 'lint-suite';

export default [...recommended];
```

Or selectively include only what you need:

```js
import { base, javascript, typescript, prettier } from 'lint-suite';

export default [
  ...base,
  ...javascript,
  ...typescript,
  ...prettier // Must be last to disable conflicting formatting rules
];
```
