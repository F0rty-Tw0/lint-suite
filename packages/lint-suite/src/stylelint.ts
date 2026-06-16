// The `stylelint` package is not a build-time dependency of this library, so its
// `Config` type cannot be imported here. This local structural type mirrors the
// subset of stylelint's Config shape that this preset uses.
type Config = {
  overrides?: ConfigOverride[];
};
type ConfigOverride = {
  files: string[];
  extends?: string[];
  plugins?: string[];
  rules?: Record<string, unknown>;
};

export const stylelint: Config = {
  overrides: [
    {
      // SCSS config also covers plain CSS (SCSS is a CSS superset; scss-only rules just don't fire on .css).
      files: ['**/*.scss', '**/*.css'],
      extends: [
        'stylelint-config-standard',
        'stylelint-config-standard-scss',
        'stylelint-config-recess-order'
      ],
      plugins: ['stylelint-scss', 'stylelint-selector-bem-pattern'],
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
