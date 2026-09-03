import type { TSESLint } from '@typescript-eslint/utils';
import type { CompatiblePlugin } from 'typescript-eslint';

type Rules = NonNullable<TSESLint.FlatConfig.Plugin['rules']>;

// typescript-eslint rule modules are not assignable to ESLint core's `Plugin`:
// their rule context still declares members ESLint 10 removed. typescript-eslint
// exports `CompatiblePlugin` as the loose shape both sides accept, so the plugin
// is built with full rule types and handed out as that shape. No cast needed.
export const definePlugin = (name: string, rules: Rules): CompatiblePlugin => {
  const plugin = { meta: { name }, rules };
  return plugin;
};
