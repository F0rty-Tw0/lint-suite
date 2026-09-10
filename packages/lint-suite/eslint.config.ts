import { defineConfig, globalIgnores } from 'eslint/config';
import {
  createTypeScriptImportResolver,
  defaultConditionNames
} from 'eslint-import-resolver-typescript';
import * as jsoncParser from 'jsonc-eslint-parser';

import { workspaceConfig } from '../../eslint.config.base.ts';
import { base } from './src/lib/base.ts';
import { boundaries } from './src/lib/boundaries.ts';
import { javascript } from './src/lib/javascript.ts';
import { prettier } from './src/lib/prettier.ts';
import { typescript } from './src/lib/typescript.ts';

const packageEntryPoints = [
  '**/src/*.ts',
  '**/main.ts',
  '**/main.*.ts',
  '**/public-api.ts',
  '**/index.ts',
  '**/*.config.{ts,mts,cts}',
  '**/*.spec.ts',
  '**/*.spec.util.ts',
  '**/*.stub.ts',
  '**/*.mock.ts',
  '**/*.d.ts',
  '**/*.stories.ts',
  '**/environment*.ts'
];

// String-located presets, fixture frameworks, test runners, and the public parser peer.
const ignoredDependencies = [
  'vitest',
  'typescript',
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
    name: 'lint-suite/prettier-width',
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          conditionNames: ['development', ...defaultConditionNames]
        })
      ]
    },
    rules: {
      'local/one-line-guard': ['error', { maxLineLength: 80 }],
      'local/no-unused-exports': ['error', { entryPoints: packageEntryPoints }]
    }
  },
  {
    name: 'lint-suite/preset-files',
    files: ['src/*.ts', 'src/lib/*.ts', 'eslint.config.ts'],
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
