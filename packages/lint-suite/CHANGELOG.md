# Changelog

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
