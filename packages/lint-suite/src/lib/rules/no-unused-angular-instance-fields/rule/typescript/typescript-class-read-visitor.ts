import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  destructuredThisReads,
  isThisExpression,
  isWriteOnly
} from './typescript-field-reads.js';
import type {
  AngularClassNode,
  ClassEntry,
  DynamicClasses
} from '../common/no-unused-angular-instance-fields.type.js';

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;
type DestructuringNode =
  TSESTree.AssignmentExpression | TSESTree.VariableDeclarator;

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

const componentThis = (node: FunctionNode, thisStack: boolean[]): boolean => {
  if (node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression) {
    return thisStack.at(-1) ?? false;
  }

  const { parent } = node;

  if (parent.type !== TSESTree.AST_NODE_TYPES.MethodDefinition) return false;

  return !parent.static;
};

const trackMemberRead = (
  node: TSESTree.MemberExpression,
  stack: ClassEntry[],
  thisStack: boolean[],
  dynamicClasses: DynamicClasses
): void => {
  const current = stack.at(-1);
  const isComponentThis = thisStack.at(-1);

  if (!current || !isComponentThis) return;

  const receiverIsThis = isThisExpression(node.object);

  if (node.computed && receiverIsThis) {
    dynamicClasses.add(current);
  }

  if (!receiverIsThis || node.computed) return;

  const isWriteOnlyTarget = isWriteOnly(node);

  if (isWriteOnlyTarget) return;

  if (node.property.type === TSESTree.AST_NODE_TYPES.Identifier) {
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
  const isComponentThis = thisStack.at(-1);

  if (!current || !isComponentThis) return;

  const reads = destructuredThisReads(node);

  if (reads === undefined) return;

  if (reads === null) {
    dynamicClasses.add(current);

    return;
  }

  for (const name of reads) {
    current.reads.add(name);
  }
};

const lexicalThisVisitor = (thisStack: boolean[]): TSESLint.RuleListener => {
  const listeners: TSESLint.RuleListener = {
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
  };

  return listeners;
};

export const classReadVisitor = (
  classes: ClassEntry[],
  stack: ClassEntry[],
  dynamicClasses: DynamicClasses
): TSESLint.RuleListener => {
  const thisStack: boolean[] = [];

  const listeners: TSESLint.RuleListener = {
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
    }
  };

  return listeners;
};
