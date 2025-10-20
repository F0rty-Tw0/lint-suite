import storybookEslint from 'eslint-plugin-storybook';
import { type ConfigArray, config } from 'typescript-eslint';

export const storybook: ConfigArray = config([
  {
    ignores: ['!.storybook'],
    files: ['**/*.stories.ts'],
    extends: [storybookEslint.configs['flat/recommended']],
    rules: {}
  }
]);
