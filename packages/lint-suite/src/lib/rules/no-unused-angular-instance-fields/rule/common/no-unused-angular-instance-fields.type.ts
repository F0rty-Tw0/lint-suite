import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

export type AngularClassNode =
  | TSESTree.ClassDeclaration
  | TSESTree.ClassExpression;

export type AngularImport = string | null;

export type AngularImports = Map<string, AngularImport>;

export type RuleOptions = {
  readonly allowEffectFields?: boolean;
  readonly analysis?: 'local' | 'project';
};

export type MessageIds = 'unusedField' | 'unusedMethod';

export type RuleContext = Readonly<
  TSESLint.RuleContext<MessageIds, [RuleOptions]>
>;

export type ProjectMemberUsed = (node: TSESTree.ClassElement) => boolean;

export type ClassEntry = {
  readonly node: AngularClassNode;
  readonly reads: Set<string>;
};

export type DynamicClasses = Set<ClassEntry>;

export type AngularClassMetadata = {
  readonly component: boolean;
  readonly metadata: TSESTree.ObjectExpression;
};

export type InstanceField = TSESTree.PropertyDefinition & {
  readonly key: TSESTree.Identifier;
};

export type InstanceMethod = TSESTree.MethodDefinition & {
  readonly key: TSESTree.Identifier;
};

export type MemberCandidate = {
  readonly messageId: MessageIds;
  readonly name: string;
  readonly node: InstanceField | InstanceMethod;
};
