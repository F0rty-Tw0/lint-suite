export const BUILT_IN_PLUGINS: string[] = [
  'eslint',
  'import',
  'jest',
  'jsdoc',
  'jsx-a11y',
  'nextjs',
  'node',
  'oxc',
  'promise',
  'react',
  'react-perf',
  'typescript',
  'unicorn',
  'vitest',
  'vue'
];

export const ALWAYS_ON_PLUGINS: string[] = ['eslint'];

export const DEFAULT_PLUGINS: string[] = ['unicorn', 'typescript', 'oxc'];

export const MODULE_GRAPH_PLUGIN = 'import';

export const MODULE_GRAPH_RULES: string[] = [
  'import/default',
  'import/export',
  'import/named',
  'import/namespace',
  'import/no-cycle',
  'import/no-named-as-default',
  'import/no-named-as-default-member',
  'import/no-self-import'
];
