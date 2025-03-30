import jsonEslint from 'eslint-plugin-json';
import type { Linter } from 'eslint';

export const json: Linter.Config[] = [
  {
    files: ['**/*.json'],
    ...jsonEslint.configs.recommended,
  },
];
