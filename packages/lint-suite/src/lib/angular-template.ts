import nx from '@nx/eslint-plugin';

export const angularTemplate = [
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.html'],
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
];
