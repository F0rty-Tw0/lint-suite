declare module 'eslint-plugin-storybook' {
  import type { Linter, Rule } from 'eslint';

  type StorybookConfigs = {
    'flat/recommended': Linter.FlatConfig[];
  };

  export const configs: StorybookConfigs;

  export const rules: Record<string, Rule.RuleModule>;
}
