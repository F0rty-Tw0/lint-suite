# @lint-suite/stylelint-no-unused-classes

`@lint-suite/stylelint-no-unused-classes` is a Stylelint rule for CSS and SCSS used by Angular or HTML templates. It reports emitted class selectors that no linked template uses, helping remove stale component styles without requiring ESLint.

## Requirements

- Stylelint 17.14.1
- TypeScript 6.0.3 or newer
- Angular compiler 22.1.5, installed with this plugin
- Node.js 24

The package is ESM-only. It is a Stylelint plugin and does not require ESLint.

## Installation

```sh
pnpm add -D @lint-suite/stylelint-no-unused-classes stylelint postcss-scss typescript
```

## Configuration

```js
// stylelint.config.mjs
import noUnusedClasses from '@lint-suite/stylelint-no-unused-classes';

export default {
  customSyntax: 'postcss-scss',
  plugins: [noUnusedClasses],
  rules: {
    'lint-suite/no-unused-classes': true
  }
};
```

The default export is the single existing `createPlugin('lint-suite/no-unused-classes', rule)` object. The rule name remains `lint-suite/no-unused-classes`.

## Rule behavior

For a component stylesheet, the rule reads every adjacent component whose `styleUrl` or `styleUrls` resolves to that file and merges its `templateUrl` or inline `template`. If no component declares the stylesheet, it falls back to the sibling HTML file and HTML files that link the stylesheet with `<link rel="stylesheet">`. Linked paths are resolved relative to consumer files. Templates elsewhere below the Stylelint working directory are also considered; `node_modules`, `dist`, `coverage`, and dot-directories are skipped.

The rule resolves SCSS nesting and selector lists. It ignores selectors beyond `::ng-deep`, `/deep/`, or `>>>`, host pseudo arguments, interpolated class names, and classes reached through `@extend`. If a linked template contains a class source that cannot be determined statically, the stylesheet is not reported rather than guessed at.

## Options

```js
{
  rules: {
    'lint-suite/no-unused-classes': [
      true,
      { ignoreClassPatterns: ['^(js|qa|mat|cdk|mdc)-', '^u-'] }
    ]
  }
}
```

`ignoreClassPatterns` defaults to `['^(js|qa|mat|cdk|mdc)-']`. Each string is compiled with the Unicode regular-expression flag. A configured array replaces the default.

## Examples

Each fixture is checked by this Stylelint rule alone. The stylesheet filename and listed companion files are required to resolve template usage. The `ignoreClassPatterns` example uses a non-default option; all other examples use default options.

### Valid examples

#### 1. Class used by a sibling template

```html
<!-- card.component.html -->
<div class="card"></div>
```

```scss
// card.component.scss
.card { color: red; }
```

#### 2. Nested class used by a sibling template

```html
<!-- panel.component.html -->
<div class="panel"><span class="panel__title"></span></div>
```

```scss
// panel.component.scss
.panel {
  &__title { color: red; }
}
```

#### 3. Class used by an inline Angular template

```ts
// banner.component.ts
import { Component } from '@angular/core';
@Component({ template: '<div class="banner"></div>', styleUrl: './banner.component.scss' })
export class BannerComponent {}
```

```scss
// banner.component.scss
.banner { color: red; }
```

#### 4. Default framework-prefix exemption

```html
<!-- hooks.component.html -->
<div></div>
```

```scss
// hooks.component.scss
.mat-button { color: red; }
```

#### 5. Class ignored by a configured pattern

```js
// Non-default rule option
{ ignoreClassPatterns: ['^u-'] }
```

```html
<!-- utility.component.html -->
<div></div>
```

```scss
// utility.component.scss
.u-hidden { display: none; }
```

#### 6. Dynamic template class source

```html
<!-- grid.component.html -->
<div [ngClass]="classes"></div>
```

```scss
// grid.component.scss
.possibly-used { display: grid; }
```

The rule does not report this stylesheet because the template's class source is not statically known.

### Invalid examples

#### 1. Unused sibling stylesheet class

```html
<!-- card.component.html -->
<div class="card"></div>
```

```scss
// card.component.scss
.card { color: red; }
.unused { color: blue; }
```

`.unused` is reported.

#### 2. Unused nested SCSS class

```html
<!-- panel.component.html -->
<div class="panel"></div>
```

```scss
// panel.component.scss
.panel {
  color: red;
  &__title { color: blue; }
}
```

`.panel__title` is reported.

#### 3. Unused class with an inline Angular template

```ts
// banner.component.ts
import { Component } from '@angular/core';
@Component({ template: '<div class="banner"></div>', styleUrl: './banner.component.scss' })
export class BannerComponent {}
```

```scss
// banner.component.scss
.banner { color: red; }
.unused { color: blue; }
```

`.unused` is reported.

#### 4. Unused class in a stylesheet linked from HTML

```html
<!-- page.html -->
<link rel="stylesheet" href="./theme.css">
<main class="theme"></main>
```

```css
/* theme.css */
.theme { color: red; }
.unused { color: blue; }
```

`.unused` is reported.

#### 5. Unused class shared by component styles

```ts
// left.component.ts
import { Component } from '@angular/core';
@Component({ template: '<div class="left"></div>', styleUrl: './shared.scss' })
export class LeftComponent {}

// right.component.ts
import { Component } from '@angular/core';
@Component({ template: '<div class="right"></div>', styleUrl: './shared.scss' })
export class RightComponent {}
```

```scss
// shared.scss
.left { color: red; }
.right { color: blue; }
.unused { color: green; }
```

`.unused` is reported after usage from both component templates is merged.

## Cache

Parsed component metadata and templates are cached in memory and persisted under `node_modules/.cache/lint-suite` in the consumer working directory. Cache files are isolated by this package's name, version, and cache format. Set `LINT_SUITE_CACHE_DIR` to choose another directory or `LINT_SUITE_CACHE=0` to disable persistence.

## License

MIT
