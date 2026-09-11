import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

export const indentOf = (
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode
): string => {
  const line = sourceCode.lines[node.loc.start.line - 1] ?? '';
  const [leading] = /^[ \t]*/.exec(line) ?? [''];

  return leading;
};
