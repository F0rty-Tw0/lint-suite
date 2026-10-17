import type { TSESTree } from '@typescript-eslint/utils';

type UtilPurityOptions = { readonly bannedModules: string[] };

export type ModuleSourceNode =
  | TSESTree.ImportDeclaration
  | TSESTree.ExportNamedDeclaration
  | TSESTree.ExportAllDeclaration
  | TSESTree.ImportExpression
  | TSESTree.TSImportEqualsDeclaration;

export type Options = [UtilPurityOptions];

export type MessageIds =
  | 'impureImport'
  | 'moduleLet'
  | 'moduleState'
  | 'ambientAccess'
  | 'nondeterministic'
  | 'impureCall';
