import type { Config } from 'prettier';

import { MAX_LINE_LENGTH } from './lib/line-length.const.ts';

export const prettier: Config = {
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  printWidth: MAX_LINE_LENGTH,
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    { files: '*.html', options: { parser: 'html' } },
    { files: '*.component.html', options: { parser: 'angular' } }
  ]
};
