declare module 'eslint-plugin-boundaries' {
  import type { ESLint, Linter, Rule } from 'eslint';

  type BoundariesRuleset = {
    rules: Linter.RulesRecord;
  };

  type BoundariesConfigs = {
    recommended: BoundariesRuleset;
    strict: BoundariesRuleset;
  };

  type BoundariesPluginShape = {
    configs: BoundariesConfigs;
    rules: Record<string, Rule.RuleModule>;
  };

  type BoundariesPlugin = BoundariesPluginShape & ESLint.Plugin;

  const plugin: BoundariesPlugin;

  export default plugin;
}
