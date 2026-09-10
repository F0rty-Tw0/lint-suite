import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'ternaryBranch';
type Branch = 'alternate' | 'consequent';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require ternary branches to hold only names, literals, or plain member access'
};

const messages: Record<MessageIds, string> = {
  ternaryBranch:
    'Ternary {{ branch }} must be a name, literal, or plain member access; name the expression first.'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint-plugin/ternary-branch-shape#readme'
);

const isPlainMemberAccess = (node: TSESTree.MemberExpression): boolean => {
  let current: TSESTree.Expression = node;

  while (current.type === TSESTree.AST_NODE_TYPES.MemberExpression) {
    current = current.object;
  }

  return current.type !== TSESTree.AST_NODE_TYPES.CallExpression;
};

const isAllowedBranch = (node: TSESTree.Expression): boolean => {
  if (node.type === TSESTree.AST_NODE_TYPES.Identifier) return true;

  if (node.type === TSESTree.AST_NODE_TYPES.Literal) return true;

  if (node.type === TSESTree.AST_NODE_TYPES.TemplateLiteral) return true;

  if (node.type === TSESTree.AST_NODE_TYPES.UnaryExpression) {
    return node.argument.type === TSESTree.AST_NODE_TYPES.Literal;
  }

  if (node.type === TSESTree.AST_NODE_TYPES.MemberExpression) {
    return isPlainMemberAccess(node);
  }

  return false;
};

export default createRule<Options, MessageIds>({
  name: 'ternary-branch-shape',
  meta,
  defaultOptions: [],
  create(context) {
    const check = (node: TSESTree.Expression, branch: Branch): void => {
      const isAllowed = isAllowedBranch(node);

      if (isAllowed) return;

      const data = { branch };
      const report: TSESLint.ReportDescriptor<MessageIds> = {
        node,
        messageId: 'ternaryBranch',
        data
      };

      context.report(report);
    };

    const listeners: TSESLint.RuleListener = {
      ConditionalExpression(node): void {
        check(node.consequent, 'consequent');
        check(node.alternate, 'alternate');
      }
    };

    return listeners;
  }
});
