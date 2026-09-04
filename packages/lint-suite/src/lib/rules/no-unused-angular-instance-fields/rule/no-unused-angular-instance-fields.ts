import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type {
  JSONSchema,
  ParserServicesWithTypeInformation,
  TSESLint
} from '@typescript-eslint/utils';

import { reportUnusedMembers } from './angular/angular-class-fields.js';
import { addAngularImport } from './angular/angular-imports.js';
import type {
  AngularImports,
  ClassEntry,
  DynamicClasses,
  MessageIds,
  ProjectMemberUsed,
  RuleContext,
  RuleOptions
} from './common/no-unused-angular-instance-fields.type.js';
import {
  projectUsage,
  projectUsageIsCurrent
} from '../project-usage/project-usage.js';
import type { ProjectUsageIndex } from '../project-usage/common/project-usage.type.js';
import { isSpecFile } from '../project-usage/utils/spec-file.util.js';
import { classReadVisitor } from './typescript/typescript-class-read-visitor.js';

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

export default createRule<Options, MessageIds>({
  name: 'no-unused-instance-fields',
  meta,
  defaultOptions,
  create(context, [options]): TSESLint.RuleListener {
    const analysis = options.analysis ?? 'local';
    const isSpec = isSpecFile(context.filename);

    if (analysis === 'project' && isSpec) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    const parserServices = projectParserServices(context, analysis);

    const imports: AngularImports = new Map();
    for (const node of context.sourceCode.ast.body) {
      if (node.type === TSESTree.AST_NODE_TYPES.ImportDeclaration) {
        addAngularImport(node, imports);
      }
    }

    let hasAngularClassImport = false;
    for (const imported of imports.values()) {
      if (
        imported === null ||
        imported === 'Component' ||
        imported === 'Directive'
      ) {
        hasAngularClassImport = true;
        break;
      }
    }

    if (!hasAngularClassImport) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    let projectMemberUsed: ProjectMemberUsed | undefined;

    if (parserServices) {
      let usage: ProjectUsageIndex | null | undefined;

      projectMemberUsed = (node: TSESTree.ClassElement): boolean => {
        if (usage === undefined) {
          usage = projectUsage(parserServices.program);
        }

        return (
          usage?.has(parserServices.esTreeNodeToTSNodeMap.get(node)) ?? true
        );
      };
    }

    const classes: ClassEntry[] = [];
    const stack: ClassEntry[] = [];
    const dynamicClasses: DynamicClasses = new Set();

    const allowEffectFields = options.allowEffectFields ?? false;

    const isProjectUsageCurrent = (): boolean => {
      if (parserServices === undefined) return false;

      return projectUsageIsCurrent(parserServices.program);
    };

    const readListeners = classReadVisitor(classes, stack, dynamicClasses);
    const listeners: TSESLint.RuleListener = {
      ...readListeners,
      'Program:exit'(): void {
        reportUnusedMembers(
          context,
          imports,
          classes,
          dynamicClasses,
          allowEffectFields,
          projectMemberUsed,
          isProjectUsageCurrent
        );
      }
    };

    return listeners;
  }
});
