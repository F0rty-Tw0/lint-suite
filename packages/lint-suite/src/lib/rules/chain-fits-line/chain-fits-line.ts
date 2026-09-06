import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'chainWrapped';
type MemberCallCallee = { readonly callee: TSESTree.MemberExpression };
type MemberCall = MemberCallCallee & TSESTree.CallExpression;

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require every call in a member call chain to keep its property on the same line'
};

const messages: Record<MessageIds, string> = {
  chainWrapped:
    'Call chain is wrapped across lines; keep every call on the same line or name intermediate steps.'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#chain-fits-line'
);

const isMemberCall = (node: TSESTree.Node): node is MemberCall => {
  if (node.type !== TSESTree.AST_NODE_TYPES.CallExpression) return false;

  return node.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression;
};

const spinePropertyLines = (node: MemberCall): number[] => {
  const lines = [node.callee.property.loc.start.line];
  let current: TSESTree.Node = node.callee.object;

  for (;;) {
    if (isMemberCall(current)) {
      lines.push(current.callee.property.loc.start.line);
      current = current.callee.object;
      continue;
    }

    if (current.type === TSESTree.AST_NODE_TYPES.MemberExpression) {
      current = current.object;
      continue;
    }

    break;
  }

  return lines;
};

export default createRule<Options, MessageIds>({
  name: 'chain-fits-line',
  meta,
  defaultOptions: [],
  create(context) {
    const listeners: TSESLint.RuleListener = {
      CallExpression(node): void {
        if (!isMemberCall(node)) return;

        const isOutermost =
          node.parent.type !== TSESTree.AST_NODE_TYPES.MemberExpression;

        if (!isOutermost) return;

        const lines = spinePropertyLines(node);

        if (lines.length < 2) return;

        const isWrapped = new Set(lines).size > 1;

        if (!isWrapped) return;

        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'chainWrapped'
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
