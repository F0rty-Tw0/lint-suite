import rxjsEslint from '@smarttools/eslint-plugin-rxjs';
const recommendedRef = rxjsEslint.configs.recommended;
const recommended =
  typeof recommendedRef === 'object' && recommendedRef !== null
    ? recommendedRef
    : {};

export const rxjs = [
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    ...recommended,
  },
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
    ],
    plugins: {
      rxjs: rxjsEslint,
    },
  },
  {
    files: [
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
    ],
    rules: {
      'rxjs/prefer-observer': 'error',
      'rxjs/finnish': 'warn',
      'rxjs/no-ignored-error': 'warn',
      'rxjs/no-unsafe-switchmap': 'error',
      'rxjs/no-unsafe-takeuntil': 'error',
      'rxjs/no-unsafe-catch': 'error',
      'rxjs/no-unsafe-first': 'error',
      'rxjs/no-topromise': 'error',
      'rxjs/throw-error': 'error',
      'rxjs/no-async-subscribe': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'rxjs/no-ignored-subscription': 'off',
    },
  },
];
