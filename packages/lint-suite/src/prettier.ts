import type { Config } from 'prettier';

export const prettier: Config = {
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  printWidth: 135,
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
