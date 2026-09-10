# @lint-suite/eslint-plugin-no-unstyled-classes

`@lint-suite/eslint-plugin-no-unstyled-classes` is an ESLint rule for Angular HTML templates. It reports static template class names that no component, linked, or configured global CSS/SCSS stylesheet selects, helping keep Angular and CSS styling contracts aligned.

## Requirements

- ESLint `^10.9.1`
- TypeScript 6.0.3 or newer
- Angular compiler 22.1.5, installed with this plugin
- `@angular-eslint/template-parser` 22 for parsing Angular templates
- Node.js 24

The package is ESM-only.

## Installation

```sh
pnpm add -D @lint-suite/eslint-plugin-no-unstyled-classes eslint @angular-eslint/template-parser typescript
```

## Configuration

```js
// eslint.config.mjs
import * as templateParser from '@angular-eslint/template-parser';
import noUnstyledClasses from '@lint-suite/eslint-plugin-no-unstyled-classes';

export default [
  {
    files: ['**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { 'no-unstyled-classes': noUnstyledClasses },
    rules: {
      'no-unstyled-classes/no-unstyled-classes': 'error'
    }
  }
];
```

The plugin contains only the `no-unstyled-classes` rule. The plugin namespace in the configuration is consumer-defined.

## Rule behavior

The rule reads static `class` tokens, `[class.name]` bindings, and literal class names from `[class]`, interpolated class attributes, `routerLinkActive`, `animate.enter`, and `animate.leave`. It deliberately does not analyze `[ngClass]`.

For an Angular component template, styles come from `styleUrl`, `styleUrls`, and inline `styles` in the adjacent component metadata. If metadata declares none, a sibling `.scss` or `.css` file is used. Plain HTML files may link relative stylesheets with `<link rel="stylesheet">`. Linked paths are resolved relative to the consumer file, not relative to this installed package.

SCSS nesting, selector lists, interpolated selectors, and `@use`, `@import`, and `@forward` partials are resolved. Absolute and root-relative stylesheet links are ignored. A template with no readable stylesheet is not reported.

## Options

```js
{
  rules: {
    'no-unstyled-classes/no-unstyled-classes': [
      'error',
      {
        ignoreClassPatterns: ['^(js|qa|mat|cdk|mdc)-', '^u-'],
        globalStyles: ['src/styles.scss']
      }
    ]
  }
}
```

- `ignoreClassPatterns` defaults to `['^(js|qa|mat|cdk|mdc)-']`. Each string is compiled with the Unicode regular-expression flag. A configured array replaces the default.
- `globalStyles` defaults to `[]`. Paths are resolved from ESLint's working directory and merged into every template's known classes. Missing files are ignored.

## Examples

Each fixture is checked by this rule alone. Every filename comment identifies a required companion file. Examples using `globalStyles` show a non-default option; all others use default options.

### Valid examples

#### 1. Static class selected by a sibling stylesheet

```html
<!-- card.component.html -->
<div class="card"></div>
```

```scss
// card.component.scss
.card {}
```

#### 2. Default framework-prefix exemption

```html
<!-- hooks.component.html -->
<button class="mat-button js-hook"></button>
```

```scss
// hooks.component.scss
.other {}
```

#### 3. Class selected by a component `styleUrl`

```ts
// card.component.ts
import { Component } from '@angular/core';
@Component({ templateUrl: './card.component.html', styleUrl: './card.component.scss' })
export class CardComponent {}
```

```html
<!-- card.component.html -->
<div class="card"></div>
```

```scss
// card.component.scss
.card {}
```

#### 4. Class selected by inline component styles

```ts
// banner.component.ts
import { Component } from '@angular/core';
@Component({ templateUrl: './banner.component.html', styles: ['.banner {}'] })
export class BannerComponent {}
```

```html
<!-- banner.component.html -->
<div class="banner"></div>
```

#### 5. Class selected by configured global styles

```js
// Non-default rule option
{ globalStyles: ['src/styles.scss'] }
```

```html
<!-- src/app.component.html -->
<main class="app-shell"></main>
```

```scss
// src/styles.scss
.app-shell {}
```

#### 6. Template without a readable stylesheet

```html
<!-- plain.component.html -->
<div class="unresolved"></div>
```

No sibling stylesheet, component metadata, or linked stylesheet is present, so the rule does not report.

### Invalid examples

#### 1. Missing static class

```html
<!-- card.component.html -->
<div class="card missing"></div>
```

```scss
// card.component.scss
.card {}
```

`missing` is reported.

#### 2. Missing `[class.name]` binding

```html
<!-- card.component.html -->
<div [class.selected]="active"></div>
```

```scss
// card.component.scss
.card {}
```

`selected` is reported.

#### 3. Missing class in an ordinary linked HTML stylesheet

```html
<!-- page.html -->
<link rel="stylesheet" href="./page.css">
<main class="missing"></main>
```

```css
/* page.css */
.page {}
```

`missing` is reported.

#### 4. Missing class despite component `styleUrls`

```ts
// hero.component.ts
import { Component } from '@angular/core';
@Component({ templateUrl: './hero.component.html', styleUrls: ['./hero.component.scss'] })
export class HeroComponent {}
```

```html
<!-- hero.component.html -->
<section class="hero missing"></section>
```

```scss
// hero.component.scss
.hero {}
```

`missing` is reported.

#### 5. Global class without the non-default `globalStyles` option

```html
<!-- src/app.component.html -->
<main class="app-shell"></main>
```

```scss
// src/app.component.scss
.app-content {}
```

```scss
// src/styles.scss (not configured)
.app-shell {}
```

With default options, `app-shell` is reported because the global stylesheet is not part of this template's styles.

## Cache

Parsed component metadata, templates, and stylesheets are cached in memory and persisted under `node_modules/.cache/lint-suite` in the consumer working directory. Cache files are isolated by this package's name, version, and cache format. Set `LINT_SUITE_CACHE_DIR` to choose another directory or `LINT_SUITE_CACHE=0` to disable persistence.

## License

MIT
