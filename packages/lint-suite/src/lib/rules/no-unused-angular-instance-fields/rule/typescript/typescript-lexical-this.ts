import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

const componentThis = (node: FunctionNode, thisStack: boolean[]): boolean => {
  if (node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression) {
    return thisStack.at(-1) ?? false;
  }

  const { parent } = node;

  if (parent.type !== TSESTree.AST_NODE_TYPES.MethodDefinition) return false;

  return !parent.static;
};

export const lexicalThisVisitor = (
  thisStack: boolean[]
): TSESLint.RuleListener => {
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
