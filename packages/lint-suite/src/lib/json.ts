import jsonEslint from 'eslint-plugin-json';
import { type ConfigArray, config } from 'typescript-eslint';

export const json: ConfigArray = config([
  {
    files: ['**/*.json'],
    extends: [jsonEslint.configs.recommended],
    rules: {}
  }
]);
