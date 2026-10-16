import { defineConfig } from 'eslint/config';
import * as jsoncParser from 'jsonc-eslint-parser';

import { dogfoodConfig } from '../../eslint.config.dogfood.ts';

// String-located presets, fixture frameworks, test runners, and the public parser peer.
const ignoredDependencies = [
  'vitest',
  'typescript',
  '@angular/common',
  '@angular/core',
  '@angular/forms',
  'rxjs',
  'stylelint-config-recess-order',
  'stylelint-config-standard',
  'stylelint-config-standard-scss'
];
const dependencyChecksOptions = {
  ignoredFiles: ['{projectRoot}/eslint.config.ts'],
  ignoredDependencies
};

const config = defineConfig(
  dogfoodConfig,
  {
    // Preset files are rule tables; naming every option literal would scatter each table across constants.
    name: 'lint-suite/preset-files',
    files: ['src/*.ts', 'src/lib/*.ts', 'eslint.config.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'local/no-nested-object-value': 'off'
    }
  },
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
