import type { TSESLint } from '@typescript-eslint/utils';
import type { CompatiblePlugin } from 'typescript-eslint';

type Rules = NonNullable<TSESLint.FlatConfig.Plugin['rules']>;

export const definePlugin = (name: string, rules: Rules): CompatiblePlugin => {
  const meta = { name };
  const plugin = { meta, rules };

  return plugin;
};
