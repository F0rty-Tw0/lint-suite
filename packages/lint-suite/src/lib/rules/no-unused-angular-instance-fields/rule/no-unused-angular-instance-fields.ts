import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type {
  ParserServicesWithTypeInformation,
  TSESLint
} from '@typescript-eslint/utils';

import {
  addAngularImport,
  reportUnusedMembers
} from './angular/angular-class-fields.js';
import type {
  AngularClassNode,
  AngularImports,
  ClassEntry,
  DynamicClasses,
  ProjectMemberUsed,
  RuleOptions
} from './common/no-unused-angular-instance-fields.type.js';
import {
  projectUsage,
  projectUsageIsCurrent
} from '../project-usage/project-usage.js';
import type { ProjectUsageIndex } from '../project-usage/common/project-usage.type.js';
import { isSpecFile } from '../project-usage/utils/spec-file.js';
import {
  destructuredThisReads,
  isThisExpression,
  isWriteOnly
} from './typescript/typescript-field-reads.js';

type Options = [RuleOptions];
type MessageIds = 'unusedField' | 'unusedMethod';
type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;
type DestructuringNode =
  TSESTree.AssignmentExpression | TSESTree.VariableDeclarator;
type RuleContext = Readonly<TSESLint.RuleContext<MessageIds, Options>>;

const defaultOptions: RuleOptions = {
  allowEffectFields: false,
  analysis: 'local'
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://eslint.org/docs/latest/rules/no-unused-private-class-members'
);

const enterClass = (
  node: AngularClassNode,
  classes: ClassEntry[],
  stack: ClassEntry[],
  thisStack: boolean[]
): void => {
  const entry: ClassEntry = {
    node,
    reads: new Set<string>()
  };

  classes.push(entry);
  stack.push(entry);
  thisStack.push(true);
};

const componentThis = (node: FunctionNode, thisStack: boolean[]): boolean =>
  node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression
    ? (thisStack.at(-1) ?? false)
    : node.parent.type === TSESTree.AST_NODE_TYPES.MethodDefinition &&
      !node.parent.static;

const trackMemberRead = (
  node: TSESTree.MemberExpression,
  stack: ClassEntry[],
  thisStack: boolean[],
  dynamicClasses: DynamicClasses
): void => {
  const current = stack.at(-1);

  if (!current || !thisStack.at(-1)) {
    return;
  }

  const receiverIsThis = isThisExpression(node.object);

  if (node.computed && receiverIsThis) {
    dynamicClasses.add(current);
  }

  if (
    receiverIsThis &&
    !node.computed &&
    node.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
    !isWriteOnly(node)
  ) {
    current.reads.add(node.property.name);
  }
};

const trackDestructuringRead = (
  node: DestructuringNode,
  stack: ClassEntry[],
  thisStack: boolean[],
  dynamicClasses: DynamicClasses
): void => {
  const current = stack.at(-1);

  if (!current || !thisStack.at(-1)) {
    return;
  }

  const reads = destructuredThisReads(node);

  if (reads === undefined) {
    return;
  }

  if (reads === null) {
    dynamicClasses.add(current);
    return;
  }

  for (const name of reads) {
    current.reads.add(name);
  }
};

const lexicalThisVisitor = (thisStack: boolean[]): TSESLint.RuleListener => ({
  FunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
    thisStack.push(componentThis(node, thisStack));
  },
  FunctionExpression(node: TSESTree.FunctionExpression): void {
    thisStack.push(componentThis(node, thisStack));
  },
  ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression): void {
    thisStack.push(componentThis(node, thisStack));
  },
  'FunctionDeclaration:exit'(): void {
    thisStack.pop();
  },
  'FunctionExpression:exit'(): void {
    thisStack.pop();
  },
  'ArrowFunctionExpression:exit'(): void {
    thisStack.pop();
  },
  StaticBlock(): void {
    thisStack.push(false);
  },
  'StaticBlock:exit'(): void {
    thisStack.pop();
  },
  PropertyDefinition(node: TSESTree.PropertyDefinition): void {
    if (node.static) {
      thisStack.push(false);
    }
  },
  'PropertyDefinition:exit'(node: TSESTree.PropertyDefinition): void {
    if (node.static) {
      thisStack.pop();
    }
  }
});

const visitor = (
  context: RuleContext,
  imports: AngularImports,
  classes: ClassEntry[],
  stack: ClassEntry[],
  dynamicClasses: DynamicClasses,
  allowEffectFields: boolean,
  projectMemberUsed: ProjectMemberUsed | undefined,
  projectIndexed: () => boolean
): TSESLint.RuleListener => {
  const thisStack: boolean[] = [];

  return {
    ClassDeclaration(node: TSESTree.ClassDeclaration): void {
      enterClass(node, classes, stack, thisStack);
    },
    ClassExpression(node: TSESTree.ClassExpression): void {
      enterClass(node, classes, stack, thisStack);
    },
    'ClassDeclaration:exit'(): void {
      stack.pop();
      thisStack.pop();
    },
    'ClassExpression:exit'(): void {
      stack.pop();
      thisStack.pop();
    },
    ...lexicalThisVisitor(thisStack),
    AssignmentExpression(node: TSESTree.AssignmentExpression): void {
      trackDestructuringRead(node, stack, thisStack, dynamicClasses);
    },
    MemberExpression(node: TSESTree.MemberExpression): void {
      trackMemberRead(node, stack, thisStack, dynamicClasses);
    },
    VariableDeclarator(node: TSESTree.VariableDeclarator): void {
      trackDestructuringRead(node, stack, thisStack, dynamicClasses);
    },
    'Program:exit'(): void {
      reportUnusedMembers(
        context,
        imports,
        classes,
        dynamicClasses,
        allowEffectFields,
        projectMemberUsed,
        projectIndexed
      );
    }
  };
};

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
      return {};
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
      return {};
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

    return visitor(
      context,
      imports,
      classes,
      stack,
      dynamicClasses,
      allowEffectFields,
      projectMemberUsed,
      () =>
        parserServices !== undefined &&
        projectUsageIsCurrent(parserServices.program)
    );
  }
});
