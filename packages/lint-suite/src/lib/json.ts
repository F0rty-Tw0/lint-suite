import type { Linter } from 'eslint';
import jsonEslint from 'eslint-plugin-json';

export const json: Linter.Config[] = [
  {
    files: ['**/*.json'],
    ...jsonEslint.configs.recommended
  }
];
