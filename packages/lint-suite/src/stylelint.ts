import type { Config } from 'stylelint';
import stylelintScss from 'stylelint-scss';
import bemPattern from 'stylelint-selector-bem-pattern';

export const stylelint: Config = {
  // Stylelint resolves config for cwd when picking a formatter; without a
  // top-level `rules` an overrides-only config fails with "No rules found".
  rules: {},
  overrides: [
    {
      files: ['**/*.scss', '**/*.css'],
      extends: [
        'stylelint-config-standard',
        'stylelint-config-standard-scss',
        'stylelint-config-recess-order'
      ],
      plugins: [...stylelintScss, bemPattern],
      rules: {
        'selector-class-pattern':
          '^(?:(?:o|c|u|t|s|is|has|_|js|qa)-)?[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:\\[.+\\])?$',
        'plugin/selector-bem-pattern': {
          preset: 'bem',
          implicitComponents: ['**/*.component.scss', '**/*.component.css'],
          ignoreCustomProperties: ['^--mdc', '^--sys']
        },
        'no-descending-specificity': null
      }
    }
  ]
};
