import baseConfig from '../../eslint.config.base.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['**/fixtures/**']
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.mjs'],
          // The `extends` configs are referenced only as string locaters in
          // src/stylelint.ts (stylelint requires strings there), so
          // @nx/dependency-checks can't detect their use. The engine and both
          // plugins ARE imported, so they're detected normally.
          // The Angular packages and rxjs are imported only by the rule test
          // fixtures under src/**/fixtures/** (real APIs for realistic
          // scenarios); they are not runtime dependencies of the package.
          ignoredDependencies: [
            '@angular/common',
            '@angular/core',
            '@angular/forms',
            'rxjs',
            '@eslint/js',
            'stylelint-config-recess-order',
            'stylelint-config-standard',
            'stylelint-config-standard-scss'
          ]
        }
      ]
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser')
    }
  }
];
