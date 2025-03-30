declare module 'eslint-plugin-import' {
  import type { Rule, Linter } from 'eslint';

  export const flatConfigs: {
    recommended: Linter.FlatConfig;
    errors: Linter.FlatConfig;
    warnings: Linter.FlatConfig;
    react: Linter.FlatConfig;
    'react-native': Linter.FlatConfig;
    electron: Linter.FlatConfig;
    typescript: Linter.FlatConfig;
    [key: string]: Linter.FlatConfig;
  };

  export const rules: Record<string, Rule.RuleModule>;
}
