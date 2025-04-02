import jestEslint from 'eslint-plugin-jest';

export const jest = [
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
    ...jestEslint.configs['flat/recommended'],
    rules: {
      ...jestEslint.configs['flat/recommended'].rules,
      ...jestEslint.configs['flat/style'].rules,
      'jest/no-done-callback': 'off',
    },
  },
];
