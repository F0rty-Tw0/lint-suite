import { configs } from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import type { Config } from 'eslint/config';

export const angularTemplate = defineConfig([
  {
    files: ['**/*.html'],
    extends: [
      ...(configs.templateAccessibility as Config[]),
      ...(configs.templateRecommended as Config[])
    ],
    rules: {
      '@angular-eslint/template/prefer-template-literal': 'error',
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/valid-aria': 'error',
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',
      '@angular-eslint/template/table-scope': 'error',
      '@angular-eslint/template/no-autofocus': 'error',
      '@angular-eslint/template/no-distracting-elements': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-ngsrc': 'error',
      '@angular-eslint/template/prefer-built-in-pipes': 'error',
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/no-nested-tags': 'error',
      '@angular-eslint/template/use-track-by-function': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/attributes-order': [
        'error',
        {
          alphabetical: true,
          order: [
            'STRUCTURAL_DIRECTIVE', // e.g. `*ngIf="true"`, `*ngFor="let item of items"`
            'TEMPLATE_REFERENCE', // e.g. `<input #inputRef>`
            'INPUT_BINDING', // e.g. `[id]="3"`, `[attr.colspan]="colspan"`, [style.width.%]="100", [@triggerName]="expression", `bind-id="handleChange()"`
            'TWO_WAY_BINDING', // e.g. `[(id)]="id"`, `bindon-id="id"
            'ATTRIBUTE_BINDING', // e.g. `<input required>`, `id="3"`
            'OUTPUT_BINDING' // e.g. `(idChange)="handleChange()"`, `on-id="handleChange()"`
          ]
        }
      ]
    }
  }
]);
