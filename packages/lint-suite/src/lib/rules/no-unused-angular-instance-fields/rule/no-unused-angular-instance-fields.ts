import { ESLintUtils } from '@typescript-eslint/utils';
import type {
  JSONSchema,
  ParserServicesWithTypeInformation,
  TSESLint,
  TSESTree
} from '@typescript-eslint/utils';

import { reportUnusedMembers } from './angular/angular-class-fields.ts';
import { angularClassImports } from './angular/angular-imports.ts';
import type {
  ClassEntry,
  DynamicClasses,
  MessageIds,
  ProjectMemberUsed,
  ReportUnusedMembersOptions,
  RuleContext,
  RuleOptions
} from './common/no-unused-angular-instance-fields.type.ts';
import { classReadVisitor } from './typescript/typescript-class-read-visitor.ts';
import type { ProjectUsageIndex } from '../project-usage/common/project-usage.type.ts';
import {
  projectUsage,
  projectUsageIsCurrent
} from '../project-usage/project-usage.ts';
import { isSpecFile } from '../project-usage/utils/spec-file.util.ts';

type Options = [RuleOptions];
type Analysis = NonNullable<RuleOptions['analysis']>;

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Disallow unread instance fields and methods in Angular components and directives'
};

const messages: Record<MessageIds, string> = {
  unusedField: "Angular instance field '{{name}}' is never read.",
  unusedMethod: "Angular instance method '{{name}}' is never read."
};

const allowEffectFieldsSchema: JSONSchema.JSONSchema4 = {
  type: 'boolean',
  description: 'Allow Angular effect() fields with automatic cleanup.'
};

const analysisSchema: JSONSchema.JSONSchema4 = {
  type: 'string',
  enum: ['local', 'project'],
  description: 'Choose local-file or typed whole-project analysis.'
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  allowEffectFields: allowEffectFieldsSchema,
  analysis: analysisSchema
};

const optionsSchema: JSONSchema.JSONSchema4 = {
  type: 'object',
  properties,
  additionalProperties: false
};

const schema: JSONSchema.JSONSchema4[] = [optionsSchema];

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'problem',
  docs,
  schema,
  messages
};

const ruleDefaults: RuleOptions = {
  allowEffectFields: false,
  analysis: 'local'
};

const defaultOptions: Options = [ruleDefaults];

const createRule = ESLintUtils.RuleCreator(
  () => 'https://eslint.org/docs/latest/rules/no-unused-private-class-members'
);

const projectParserServices = (
  context: RuleContext,
  analysis: Analysis
): ParserServicesWithTypeInformation | undefined => {
  if (analysis !== 'project') return undefined;

  try {
    return ESLintUtils.getParserServices(context);
  } catch {
    throw new Error(
      'Project analysis requires parser services with type information.'
    );
  }
};

const projectMemberUsedFor = (
  parserServices: ParserServicesWithTypeInformation | undefined
): ProjectMemberUsed | undefined => {
  if (parserServices === undefined) return undefined;

  let usage: ProjectUsageIndex | null | undefined;

  const memberUsed = (node: TSESTree.ClassElement): boolean => {
    if (usage === undefined) {
      usage = projectUsage(parserServices.program);
    }

    return usage?.has(parserServices.esTreeNodeToTSNodeMap.get(node)) ?? true;
  };

  return memberUsed;
};

export default createRule<Options, MessageIds>({
  name: 'no-unused-instance-fields',
  meta,
  defaultOptions,
  create(context, [options]): TSESLint.RuleListener {
    const analysis = options.analysis ?? 'local';
    const isSpec = isSpecFile(context.filename);
    const noListeners: TSESLint.RuleListener = {};

    if (analysis === 'project' && isSpec) return noListeners;

    const parserServices = projectParserServices(context, analysis);
    const imports = angularClassImports(context.sourceCode.ast);

    if (!imports) return noListeners;

    const classes: ClassEntry[] = [];
    const stack: ClassEntry[] = [];
    const dynamicClasses: DynamicClasses = new Set();

    const projectIndexed = (): boolean => {
      if (parserServices === undefined) return false;

      return projectUsageIsCurrent(parserServices.program);
    };

    const reportOptions: ReportUnusedMembersOptions = {
      allowEffectFields: options.allowEffectFields ?? false,
      classes,
      context,
      dynamicClasses,
      imports,
      projectIndexed,
      projectMemberUsed: projectMemberUsedFor(parserServices)
    };

    const readListeners = classReadVisitor(classes, stack, dynamicClasses);
    const listeners: TSESLint.RuleListener = {
      ...readListeners,
      'Program:exit'(): void {
        reportUnusedMembers(reportOptions);
      }
    };

    return listeners;
  }
});
