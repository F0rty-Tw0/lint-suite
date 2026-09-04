import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type {
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

const defaultOptions: RuleOptions = {
  allowEffectFields: false,
  analysis: 'local'
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://eslint.org/docs/latest/rules/no-unused-private-class-members'
);

const projectParserServices = (
  context: RuleContext
): ParserServicesWithTypeInformation => {
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
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow unread instance fields and methods in Angular components and directives'
    },
    messages: {
      unusedField: "Angular instance field '{{name}}' is never read.",
      unusedMethod: "Angular instance method '{{name}}' is never read."
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowEffectFields: {
            type: 'boolean',
            description: 'Allow Angular effect() fields with automatic cleanup.'
          },
          analysis: {
            type: 'string',
            enum: ['local', 'project'],
            description: 'Choose local-file or typed whole-project analysis.'
          }
        },
        additionalProperties: false
      }
    ]
  },
  defaultOptions: [defaultOptions],
  create(context, [options]): TSESLint.RuleListener {
    const analysis = options.analysis ?? 'local';

    if (analysis === 'project' && isSpecFile(context.filename)) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    const parserServices =
      analysis === 'project' ? projectParserServices(context) : undefined;

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

    const listeners: TSESLint.RuleListener = {
      ...classReadVisitor(classes, stack, dynamicClasses),
      'Program:exit'(): void {
        reportUnusedMembers(
          context,
          imports,
          classes,
          dynamicClasses,
          allowEffectFields,
          projectMemberUsed,
          () =>
            parserServices !== undefined &&
            projectUsageIsCurrent(parserServices.program)
        );
      }
    };

    return listeners;
  }
});
