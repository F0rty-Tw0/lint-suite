import type { OxlintConfig } from 'oxlint';

import { RXJS_PLUGIN } from '../common/js-plugin.const.ts';

export const rxjs: OxlintConfig = {
  categories: { correctness: 'off' },
  jsPlugins: [RXJS_PLUGIN],
  rules: {
    '@smarttools/rxjs/no-ignored-replay-buffer': 'error',
    '@smarttools/rxjs/no-ignored-takewhile-value': 'error',
    '@smarttools/rxjs/no-index': 'error',
    '@smarttools/rxjs/no-internal': 'error',
    '@smarttools/rxjs/no-sharereplay': ['error', { allowConfig: true }]
  }
};
