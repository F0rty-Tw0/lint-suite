import type { Config } from 'stylelint';
import stylelintScss from 'stylelint-scss';
import bemPattern from 'stylelint-selector-bem-pattern';

export const stylelint: Config = {
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
