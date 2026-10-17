import type { OxlintConfig } from 'oxlint';

import {
  STORYBOOK_MAIN_FILES,
  STORYBOOK_STORIES_FILES
} from '../common/file-globs.const.ts';
import { STORYBOOK_PLUGIN } from '../common/js-plugin.const.ts';

export const storybook: OxlintConfig = {
  categories: { correctness: 'off' },
  plugins: ['import'],
  jsPlugins: [STORYBOOK_PLUGIN],
  overrides: [
    {
      files: STORYBOOK_STORIES_FILES,
      rules: {
        'import/no-anonymous-default-export': 'off',
        'storybook/await-interactions': 'error',
        'storybook/context-in-play-function': 'error',
        'storybook/default-exports': 'error',
        'storybook/hierarchy-separator': 'warn',
        'storybook/no-redundant-story-name': 'warn',
        'storybook/no-renderer-packages': 'error',
        'storybook/prefer-pascal-case': 'warn',
        'storybook/story-exports': 'error',
        'storybook/use-storybook-expect': 'error',
        'storybook/use-storybook-testing-library': 'error',
        'storybook/csf-component': 'warn',
        'storybook/no-stories-of': 'error'
      }
    },
    {
      files: STORYBOOK_MAIN_FILES,
      rules: {
        'storybook/no-uninstalled-addons': [
          'error',
          { packageJsonLocation: '', ignore: [] }
        ]
      }
    }
  ]
};
