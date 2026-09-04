import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  destructuredThisReads,
  isThisExpression
} from './typescript-field-reads.ts';
import { lexicalThisVisitor } from './typescript-lexical-this.ts';
import { isWriteOnly } from './typescript-write-targets.ts';
import type {
  AngularClassNode,
  ClassEntry,
  DynamicClasses
} from '../common/no-unused-angular-instance-fields.type.ts';

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
