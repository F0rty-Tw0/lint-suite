import type { OxlintConfig } from 'oxlint';

import {
  ACTION_FILES,
  SPEC_FILES,
  STORIES_FILES,
  STUB_FILES
} from '../common/file-globs.const.ts';

export const typescriptOverrides: OxlintConfig = {
  overrides: [
    {
      files: SPEC_FILES,
      rules: {
        'eslint/no-empty-function': 'off',
        'typescript/consistent-type-assertions': 'off'
      }
    },
    {
      files: ACTION_FILES,
      rules: {
        'typescript/no-extraneous-class': 'off',
        'typescript/no-namespace': 'off',
        'typescript/parameter-properties': 'off'
      }
    },
    { files: STUB_FILES, rules: { 'typescript/no-inferrable-types': 'off' } },
    {
      files: STORIES_FILES,
      rules: { 'typescript/consistent-type-assertions': 'off' }
    }
  ]
};
