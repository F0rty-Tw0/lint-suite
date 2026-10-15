import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

export type ParsedSource = {
  readonly ast: TSESTree.Program;
  readonly sourceCode: TSESLint.SourceCode;
};
