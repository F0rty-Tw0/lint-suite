# Changelog

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
