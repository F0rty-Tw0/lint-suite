import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  addAngularImport,
  reportUnusedMembers
} from './angular-class-fields.js';
import type {
  AngularClassNode,
  AngularImports,
  ClassEntry,
  DynamicClasses
} from './common/no-unused-angular-instance-fields.type.js';
import {
  destructuredThisReads,
  isThisExpression,
  isWriteOnly
} from './utils/typescript-field-reads.util.js';

type Options = [];
type MessageIds = 'unusedField' | 'unusedMethod';
type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;
type DestructuringNode =
  | TSESTree.AssignmentExpression
  | TSESTree.VariableDeclarator;
type RuleContext = Readonly<TSESLint.RuleContext<MessageIds, Options>>;

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

const componentThis = (
  node: FunctionNode,
  thisStack: boolean[]
): boolean =>
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
  dynamicClasses: DynamicClasses
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
      reportUnusedMembers(context, imports, classes, dynamicClasses);
    }
  };
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
    schema: []
  },
  defaultOptions: [],
  create(context): TSESLint.RuleListener {
    const imports: AngularImports = new Map();
    for (const node of context.sourceCode.ast.body) {
      if (node.type === TSESTree.AST_NODE_TYPES.ImportDeclaration) {
        addAngularImport(node, imports);
      }
    }

    if (imports.size === 0) {
      return {};
    }
    const classes: ClassEntry[] = [];
    const stack: ClassEntry[] = [];
    const dynamicClasses: DynamicClasses = new Set();

    return visitor(context, imports, classes, stack, dynamicClasses);
  }
});
