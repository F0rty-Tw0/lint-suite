import { fileURLToPath } from 'node:url';

import noUnusedClasses from '@lint-suite/stylelint-no-unused-classes';
import type { Config } from 'stylelint';
import stylelintScss from 'stylelint-scss';
import bemPattern from 'stylelint-selector-bem-pattern';

const resolveConfig = (specifier: string): string => {
  const url = import.meta.resolve(specifier);

  return fileURLToPath(url);
};

export const stylelint: Config = {
  // Stylelint resolves config for cwd when picking a formatter; without a
  // top-level `rules` an overrides-only config fails with "No rules found".
  rules: {},
  overrides: [
    {
      files: ['**/*.scss', '**/*.css'],
      extends: [
        resolveConfig('stylelint-config-standard'),
        resolveConfig('stylelint-config-standard-scss'),
        resolveConfig('stylelint-config-recess-order')
      ],
      plugins: [...stylelintScss, bemPattern, noUnusedClasses],
      rules: {
        'selector-class-pattern':
          '^(?:(?:o|c|u|t|s|is|has|_|js|qa)-)?[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:\\[.+\\])?$',
        'plugin/selector-bem-pattern': {
          preset: 'bem',
          implicitComponents: ['**/*.component.scss', '**/*.component.css'],
          ignoreCustomProperties: ['^--mdc', '^--sys']
        },
        'no-descending-specificity': null,
        // A stylesheet class no linked template uses is reported.
        // Bad: .ghost {} used by no template
        // Good: delete it, or use it in a template
        'lint-suite/no-unused-classes': true
      }
    }
  ]
};
