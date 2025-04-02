import jsonEslint from 'eslint-plugin-json';

export const json = [
  {
    files: ['**/*.json'],
    ...jsonEslint.configs.recommended,
  },
];
