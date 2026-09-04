import baseConfig from '../../eslint.config.base.ts';
import {
  base,
  boundaries,
  javascript,
  prettier,
  typescript
} from './src/eslint.ts';

// Used only as string locators (stylelint extends), by fixtures (angular, rxjs), or by specs (vitest).
const ignoredDependencies = [
  'vitest',
  '@angular/common',
  '@angular/core',
  '@angular/forms',
  'rxjs',
  '@eslint/js',
  'stylelint-config-recess-order',
  'stylelint-config-standard',
  'stylelint-config-standard-scss'
];
const dependencyChecksOptions = {
  ignoredFiles: ['{projectRoot}/eslint.config.ts'],
  ignoredDependencies
};
const jsonRules = {
  '@nx/dependency-checks': ['error', dependencyChecksOptions]
};
const jsonLanguageOptions = { parser: await import('jsonc-eslint-parser') };

const config = [
  ...base,
  ...javascript,
  ...typescript,
  ...boundaries,
  ...prettier,
  ...baseConfig,
  {
    ignores: ['**/fixtures/**']
  },
  {
    files: ['**/*.json'],
    rules: jsonRules,
    languageOptions: jsonLanguageOptions
  }
];

export default config;
