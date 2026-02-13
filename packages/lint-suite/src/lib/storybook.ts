import storybookEslint from 'eslint-plugin-storybook';
import { defineConfig } from 'eslint/config';

export const storybook = defineConfig([
  {
    ignores: ['!.storybook'],
    files: ['**/*.stories.ts'],
    extends: [storybookEslint.configs['flat/recommended']],
    rules: {
      'storybook/csf-component': 'warn', // Ensure component property is set
      'storybook/no-stories-of': 'error' // Prevent deprecated storiesOf API
    }
  }
]);
