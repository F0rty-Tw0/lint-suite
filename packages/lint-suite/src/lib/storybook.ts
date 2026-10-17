import { defineConfig } from 'eslint/config';
import storybookEslint from 'eslint-plugin-storybook';

export const storybook = defineConfig([
  storybookEslint.configs['flat/recommended'],
  {
    files: [
      '**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)',
      '**/*.story.@(ts|tsx|js|jsx|mjs|cjs)'
    ],
    rules: {
      'storybook/csf-component': 'warn', // Ensure component property is set
      'storybook/no-stories-of': 'error' // Prevent deprecated storiesOf API
    }
  },
  {
    files: ['**/.storybook/main.@(js|cjs|mjs|ts|mts|cts)'],
    rules: {
      'storybook/no-uninstalled-addons': 'error'
    }
  }
]);
