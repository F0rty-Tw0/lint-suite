declare module '@smarttools/eslint-plugin-rxjs' {
  import type { ESLint, Linter, Rule } from 'eslint';

  type RxjsConfigs = {
    recommended: Linter.Config;
    all?: Linter.Config;
    [key: string]: Linter.Config;
  };

  type RxjsPluginShape = {
    rules: Record<string, Rule.RuleModule>;
    configs: RxjsConfigs;
  };

  type ESLintPlugin = RxjsPluginShape & ESLint.Plugin;

  const plugin: ESLintPlugin;
  export = plugin;
}
