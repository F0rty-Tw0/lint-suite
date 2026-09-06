declare module 'eslint-plugin-import-x' {
  import type { Linter, Rule } from 'eslint';

  type ImportXFlatConfigs = {
    recommended: Linter.FlatConfig;
    errors: Linter.FlatConfig;
    warnings: Linter.FlatConfig;
    react: Linter.FlatConfig;
    'react-native': Linter.FlatConfig;
    electron: Linter.FlatConfig;
    typescript: Linter.FlatConfig;
    [key: string]: Linter.FlatConfig;
  };

  export const flatConfigs: ImportXFlatConfigs;

  export const rules: Record<string, Rule.RuleModule>;
}
