# Lint Suite Release Notes

## Overview

Lint Suite provides a comprehensive set of ESLint Flat configurations for modern web applications with a focus on Angular, TypeScript, and RxJS development. It emphasizes code quality, maintainability, and accessibility through carefully curated rule sets.

## Key Features

### TypeScript Rules

- Enforces explicit member accessibility for better code readability
- Requires consistent type imports to standardize import styles
- Warns on missing function return types for improved type safety
- Enforces readonly properties where appropriate
- Disallows empty functions to prevent unexpected behavior
- Special configurations for action, state, and spec files

### Angular Rules

- Enforces OnPush change detection strategy for better performance
- Comprehensive template accessibility rules
- Structured attributes ordering for consistent template formatting
- Controls for self-closing tags, control flow syntax, and ngSrc usage
- Signal-based component patterns enforcement

### RxJS Rules

- Finnish notation warnings for Observable naming conventions
- Prevents unsafe operators usage (switchMap, takeUntil, catch, first)
- Warns about ignored errors in Observable chains
- Disallows toPromise() conversions
- Enforces proper error throwing patterns
- Ensures Observer pattern usage

### Code Style & Structure

- Maximum line length (135 characters)
- Maximum file size (150 lines, 300 for test files)
- Consistent comment formatting
- Standardized comma dangle rules
- Proper indentation with special cases for ternary expressions
- Organized imports with consistent grouping and robust internal module detection

### HTML & Accessibility

- Enforces button types for better accessibility
- Controls tabindex usage
- Validates ARIA attributes
- Requires alt text for images
- Ensures proper structure for HTML elements
- Keyboard event handlers alongside mouse events
- Proper table scoping
- Prevents autofocus and distracting elements

### Testing Support

- Jest-specific configurations
- Relaxed rules for test files where appropriate

### Additional Features

- Enforced Module Boundaries (feature, data-access, ui, etc.)
- JSON file linting
- Storybook support
- Base JavaScript configurations

## Benefits

- Improved code consistency across projects
- Enhanced accessibility compliance
- Better performance through enforced best practices
- Reduced technical debt
- Streamlined developer experience

## Getting Started

Install the package and extend your ESLint configuration with the specific rule sets you need:

```js
import { base, javascript, typescript } from 'lint-suite';

export default [
  ...base,
  ...javascript,
  ...typescript
  // Rest of the required configurations
];
```
