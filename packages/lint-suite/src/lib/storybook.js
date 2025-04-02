import storybookEslint from 'eslint-plugin-storybook';

export const storybook = [
  ...storybookEslint.configs['flat/recommended'],
  {
    ignores: ['!.storybook'],
    files: ['**/*.stories.ts'],
  },
];
