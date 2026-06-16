import baseConfig from '../../eslint.config.base.mjs';

export default [
  ...baseConfig,
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
          ignoredDependencies: [
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
