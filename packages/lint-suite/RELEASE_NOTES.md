# Lint Suite Release Notes

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
