declare module 'eslint-plugin-boundaries' {
  import type { ESLint, Linter, Rule } from 'eslint';

  interface BoundariesPlugin extends ESLint.Plugin {
    configs: {
      recommended: {
        rules: Linter.RulesRecord;
      };
      strict: {
        rules: Linter.RulesRecord;
      };
    };
    rules: Record<string, Rule.RuleModule>;
  }

  const plugin: BoundariesPlugin;
  export default plugin;
}
