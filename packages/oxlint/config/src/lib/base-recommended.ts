import type { OxlintConfig } from 'oxlint';

import { JS_FILES } from '../common/file-globs.const.ts';
import { STYLISTIC_PLUGIN } from '../common/js-plugin.const.ts';

export const baseRecommended: OxlintConfig = {
  plugins: ['import'],
  jsPlugins: [STYLISTIC_PLUGIN],
  rules: {
    '@stylistic/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never', propElementValues: 'always' }
    ],
    '@stylistic/jsx-function-call-newline': ['error', 'multiline'],
    '@stylistic/lines-between-class-members': [
      'error',
      'always',
      { exceptAfterOverload: true, exceptAfterSingleLine: true }
    ],
    '@stylistic/spaced-comment': [
      'error',
      'always',
      {
        block: { balanced: true, exceptions: ['*'], markers: ['!'] },
        line: { exceptions: ['/', '#'], markers: ['/'] }
      }
    ],
    'import/export': 'error'
  },
  overrides: [
    {
      files: JS_FILES,
      rules: {
        'import/default': 'error',
        'import/named': 'error',
        'import/namespace': 'error',
        'import/no-duplicates': 'warn',
        'import/no-named-as-default': 'warn',
        'import/no-named-as-default-member': 'warn'
      }
    }
  ]
};
