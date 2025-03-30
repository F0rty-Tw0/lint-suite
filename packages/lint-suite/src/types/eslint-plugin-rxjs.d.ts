declare module '@smarttools/eslint-plugin-rxjs' {
  import type { Linter, Rule } from 'eslint';

  interface ESLintPlugin extends ESLint.Plugin {
    rules: Record<string, Rule.RuleModule>;
    configs: {
      recommended: Linter.Config;
      all?: Linter.Config;
      [key: string]: Linter.Config;
    };
  }

  const plugin: ESLintPlugin;
  export = plugin;
}
