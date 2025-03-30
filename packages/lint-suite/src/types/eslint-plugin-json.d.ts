declare module 'eslint-plugin-json' {
  import type { Rule, Linter, ESLint } from 'eslint';

  interface ESLintPlugin extends ESLint.Plugin {
    rules: Record<string, Rule.RuleModule>;
    configs: {
      recommended: Linter.Config;
      'recommended-with-comments': Linter.Config;
      'recommended-legacy': Linter.Config;
      'recommended-with-comments-legacy': Linter.Config;
      [key: string]: Linter.FlatConfig;
    };
  }

  const plugin: ESLintPlugin;
  export default plugin;
}
