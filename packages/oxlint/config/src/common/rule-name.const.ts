export const ESLINT_JS_RULES: string[] = [
  'no-restricted-syntax',
  'spaced-comment',
  'no-octal',
  'no-dupe-args'
];

export const ESLINT_PLUGIN_PACKAGE_PREFIX = 'eslint-plugin-';

export const PLUGIN_PREFIX_ALIASES: Readonly<Record<string, string>> = {
  '@next/next': 'nextjs',
  '@typescript-eslint': 'typescript',
  deepscan: 'oxc',
  'import-x': 'import',
  jsx_a11y: 'jsx-a11y',
  'react-hooks': 'react',
  react_perf: 'react-perf'
};

export const TS_EXTENSION_RULES: string[] = [
  'class-methods-use-this',
  'default-param-last',
  'init-declarations',
  'max-params',
  'no-array-constructor',
  'no-dupe-class-members',
  'no-empty-function',
  'no-loop-func',
  'no-loss-of-precision',
  'no-magic-numbers',
  'no-redeclare',
  'no-restricted-imports',
  'no-shadow',
  'no-unused-expressions',
  'no-unused-private-class-members',
  'no-unused-vars',
  'no-use-before-define',
  'no-useless-constructor',
  'prefer-destructuring'
];
