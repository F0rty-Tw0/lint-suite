import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

export type AngularClassNode =
  TSESTree.ClassDeclaration | TSESTree.ClassExpression;

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

export type ReportContext = Pick<
  RuleContext,
  'filename' | 'report' | 'sourceCode'
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

export type IdentifierKey = {
  readonly key: TSESTree.Identifier;
};

export type InstanceField = TSESTree.PropertyDefinition & IdentifierKey;

export type InstanceMethod = TSESTree.MethodDefinition & IdentifierKey;

export type MemberCandidate = {
  readonly messageId: MessageIds;
  readonly name: string;
  readonly node: InstanceField | InstanceMethod;
};

export type FieldCandidateOptions = {
  readonly allowEffectFields: boolean;
  readonly imports: AngularImports;
  readonly localPrivateOnly: boolean;
  readonly sourceCode: TSESLint.SourceCode;
};

export type MetadataReadsOptions = {
  readonly component: boolean;
  readonly filename: string;
  readonly metadata: TSESTree.ObjectExpression;
  readonly remainingNames: string[];
  readonly requireTemplate: boolean;
};

export type ReportUnusedMembersOptions = {
  readonly allowEffectFields: boolean;
  readonly classes: ClassEntry[];
  readonly context: ReportContext;
  readonly dynamicClasses: DynamicClasses;
  readonly imports: AngularImports;
  readonly projectIndexed: () => boolean;
  readonly projectMemberUsed: ProjectMemberUsed | undefined;
};
