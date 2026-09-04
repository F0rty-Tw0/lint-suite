import { defineConfig, globalIgnores } from 'eslint/config';
import * as jsoncParser from 'jsonc-eslint-parser';

import { workspaceConfig } from '../../eslint.config.base.ts';
import { base } from './src/lib/base.ts';
import { boundaries } from './src/lib/boundaries.ts';
import { javascript } from './src/lib/javascript.ts';
import { prettier } from './src/lib/prettier.ts';
import { typescript } from './src/lib/typescript.ts';

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

const config = defineConfig(
  base,
  javascript,
  typescript,
  boundaries,
  prettier,
  workspaceConfig,
  globalIgnores(['**/fixtures/**'], 'lint-suite/fixtures'),
  {
    name: 'lint-suite/dependency-checks',
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': ['error', dependencyChecksOptions]
    },
    languageOptions: { parser: jsoncParser }
  }
);

export default config;
