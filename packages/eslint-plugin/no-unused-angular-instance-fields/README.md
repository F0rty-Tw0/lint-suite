# @lint-suite/eslint-plugin-no-unused-angular-instance-fields

`@lint-suite/eslint-plugin-no-unused-angular-instance-fields` is an ESLint rule for Angular and TypeScript that reports unread component and directive instance fields and methods. Project analysis recognizes reads from TypeScript, Angular templates, and component or directive host metadata.

## Requirements

- Node.js 24
- ESLint `^10.9.1`
- TypeScript 6.0.3 or newer
- Angular compiler 22.1.5, installed with this plugin
- `typescript-eslint` parser services for the default project analysis

## Install

```sh
pnpm add -D @lint-suite/eslint-plugin-no-unused-angular-instance-fields eslint typescript typescript-eslint
```

## Configure

```js
// eslint.config.js
import angularInstanceFields from '@lint-suite/eslint-plugin-no-unused-angular-instance-fields';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true }
    },
    plugins: {
      'no-unused-instance-fields': angularInstanceFields
    },
    rules: {
      'no-unused-instance-fields/no-unused-instance-fields': 'error'
    }
  }
];
```

The default `analysis: 'project'` examines the TypeScript project, including reads from external templates and host bindings. It requires parser services with type information. Project-mode spec files are skipped. Set `analysis: 'local'` to inspect only the linted file when project-aware analysis is unavailable.

## Options

```ts
type Options = {
  analysis?: 'local' | 'project';
  allowEffectFields?: boolean;
};
```

`allowEffectFields` defaults to `false`. When `true`, effect fields with Angular's automatic cleanup are not reported.

```js
rules: {
  'no-unused-instance-fields/no-unused-instance-fields': [
    'error',
    { analysis: 'local', allowEffectFields: true }
  ]
}
```

The preceding configuration is non-default local mode: it does not inspect other project files. The examples below are checked by this rule alone. Examples labeled **project mode** require the `projectService` configuration above and all listed files in the TypeScript project; all other examples explicitly use local mode.

## Examples

### Valid examples

#### 1. Field read by the component class

```ts
// card.component.ts — local mode
import { Component } from '@angular/core';
@Component({ template: '{{ label() }}' })
class CardComponent {
  readonly title = 'Card';
  label(): string { return this.title; }
}
```

#### 2. Field read by an inline template

```ts
// card.component.ts — local mode
import { Component } from '@angular/core';
@Component({ template: '{{ title }}' })
class CardComponent {
  readonly title = 'Card';
}
```

#### 3. Field read by host metadata

```ts
// card.component.ts — local mode
import { Component } from '@angular/core';
@Component({ host: { '[attr.aria-label]': 'label' }, template: '' })
class CardComponent {
  readonly label = 'Card';
}
```

#### 4. Field read by an external template

```ts
// card.component.ts — project mode
import { Component } from '@angular/core';
@Component({ templateUrl: './card.component.html' })
class CardComponent { readonly title = 'Card'; }

```

```html
<!-- card.component.html -->
<h1>{{ title }}</h1>
```

#### 5. Dynamically indexed component

```ts
// card.component.ts — local mode
import { Component } from '@angular/core';
@Component({ template: '' })
class CardComponent {
  readonly title = 'Card';
  read(key: string): unknown { return this[key]; }
}
```

### Invalid examples

#### 1. Unread component field

```ts
// card.component.ts — local mode
import { Component } from '@angular/core';
@Component({ template: '' })
class CardComponent { readonly unused = 'remove me'; }
```

#### 2. Unread component method

```ts
// card.component.ts — local mode
import { Component } from '@angular/core';
@Component({ template: '' })
class CardComponent { refresh(): void {} }
```

#### 3. Unread injected field

```ts
// card.component.ts — local mode
import { Component, inject } from '@angular/core';
class CardService {}
@Component({ template: '' })
class CardComponent { private readonly service = inject(CardService); }
```

#### 4. Unread directive field

```ts
// state.directive.ts — local mode
import { Directive } from '@angular/core';
@Directive({ selector: '[appState]' })
class StateDirective { private readonly state = 'idle'; }
```

#### 5. Field no project file reads

```ts
// card.component.ts — project mode
import { Component } from '@angular/core';
@Component({ templateUrl: './card.component.html' })
class CardComponent { readonly hidden = 'remove me'; }

```

```html
<!-- card.component.html -->
<p>Card</p>
```
