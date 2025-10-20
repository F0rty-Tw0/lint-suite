declare module 'eslint-plugin-storybook' {
  import type { Linter, Rule } from 'eslint';

  export const configs: {
    'flat/recommended': Linter.FlatConfig[];
  };

  export const rules: Record<string, Rule.RuleModule>;
}
