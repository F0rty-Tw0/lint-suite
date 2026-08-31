import type { TSESTree } from '@typescript-eslint/utils';

export type AngularClassNode =
  TSESTree.ClassDeclaration | TSESTree.ClassExpression;

export type AngularImport = string | null;

export type AngularImports = Map<string, AngularImport>;

export type RuleOptions = [
  {
    allowEffectFields?: boolean;
    analysis?: 'local' | 'project';
  }
];

export type ClassEntry = {
  readonly node: AngularClassNode;
  readonly reads: Set<string>;
};

export type DynamicClasses = Set<ClassEntry>;
