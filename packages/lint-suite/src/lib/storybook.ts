import storybookEslint from 'eslint-plugin-storybook';
import type { Linter } from 'eslint';

export const storybook: Linter.Config[] = [
  ...storybookEslint.configs['flat/recommended'],
  {
    ignores: ['!.storybook'],
    files: ['**/*.stories.ts'],
  },
];
