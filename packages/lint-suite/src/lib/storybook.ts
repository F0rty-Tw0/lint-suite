import type { Linter } from 'eslint';
import storybookEslint from 'eslint-plugin-storybook';

export const storybook: Linter.Config[] = [
  ...storybookEslint.configs['flat/recommended'],
  {
    ignores: ['!.storybook'],
    files: ['**/*.stories.ts']
  }
];
