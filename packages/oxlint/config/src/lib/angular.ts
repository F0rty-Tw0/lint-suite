import globals from 'globals';
import type { OxlintConfig } from 'oxlint';

import { ANGULAR_FILES } from '../common/file-globs.const.ts';
import {
  ANGULAR_ESLINT_PLUGIN,
  NO_UNUSED_ANGULAR_FIELDS_PLUGIN
} from '../common/js-plugin.const.ts';
import { toOxlintGlobals } from '../utils/oxlint-globals.util.ts';

const environment = { ...globals.browser, ...globals.es2025, ...globals.node };

export const angular: OxlintConfig = {
  categories: { correctness: 'off' },
  jsPlugins: [ANGULAR_ESLINT_PLUGIN, NO_UNUSED_ANGULAR_FIELDS_PLUGIN],
  overrides: [
    {
      files: ANGULAR_FILES,
      globals: toOxlintGlobals(environment),
      rules: {
        '@angular-eslint/contextual-lifecycle': 'error',
        '@angular-eslint/no-empty-lifecycle-method': 'error',
        '@angular-eslint/no-input-rename': ['error', { allowedNames: [] }],
        '@angular-eslint/no-inputs-metadata-property': 'error',
        '@angular-eslint/no-output-native': 'error',
        '@angular-eslint/no-output-on-prefix': 'error',
        '@angular-eslint/no-output-rename': 'error',
        '@angular-eslint/no-outputs-metadata-property': 'error',
        '@angular-eslint/prefer-inject': 'error',
        '@angular-eslint/prefer-on-push-component-change-detection': [
          'error',
          { allowExplicitOnPush: true }
        ],
        '@angular-eslint/prefer-standalone': 'error',
        '@angular-eslint/use-pipe-transform-interface': 'error',
        '@angular-eslint/use-lifecycle-interface': 'warn',
        '@angular-eslint/prefer-signals': [
          'error',
          {
            preferReadonlySignalProperties: true,
            preferInputSignals: true,
            preferQuerySignals: true,
            useTypeChecking: false,
            additionalSignalCreationFunctions: []
          }
        ],
        '@angular-eslint/use-injectable-provided-in': [
          'error',
          { allowProvidedInNull: false }
        ],
        '@angular-eslint/prefer-signal-model': [
          'error',
          { useTypeChecking: false }
        ],
        '@angular-eslint/prefer-host-metadata-property': 'error',
        '@angular-eslint/no-implicit-take-until-destroyed': 'error',
        '@angular-eslint/no-async-lifecycle-method': 'error',
        '@angular-eslint/prefer-output-readonly': 'warn',
        '@angular-eslint/prefer-output-emitter-ref': 'warn',
        '@angular-eslint/sort-lifecycle-methods': 'warn',
        '@angular-eslint/computed-must-return': 'error',
        '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
        '@angular-eslint/no-lifecycle-call': 'error',
        '@angular-eslint/require-lifecycle-on-prototype': 'error',
        '@angular-eslint/relative-url-prefix': 'error',
        '@angular-eslint/use-component-selector': 'error'
      }
    }
  ]
};
