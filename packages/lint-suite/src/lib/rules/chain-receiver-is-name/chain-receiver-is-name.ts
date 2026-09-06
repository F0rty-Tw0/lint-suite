import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { indentOf } from '../utils/indent-of.util.ts';

type Options = [];
type MessageIds = 'chainReceiver' | 'extractReceiver';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require a call chain to start from a name, not an inline expression'
};

const messages: Record<MessageIds, string> = {
  chainReceiver:
    'Call chain starts from an inline expression; extract it to a named constant first.',
  extractReceiver: "Extract the receiver to a 'value' constant."
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  hasSuggestions: true,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#chain-receiver-is-name'
);

const UNNAMED_RECEIVER_TYPES = new Set([
  TSESTree.AST_NODE_TYPES.LogicalExpression,
  TSESTree.AST_NODE_TYPES.ConditionalExpression,
  TSESTree.AST_NODE_TYPES.ObjectExpression,
  TSESTree.AST_NODE_TYPES.ArrayExpression,
  TSESTree.AST_NODE_TYPES.AwaitExpression,
  TSESTree.AST_NODE_TYPES.BinaryExpression,
  TSESTree.AST_NODE_TYPES.TemplateLiteral
]);

type NonRootNode = Exclude<TSESTree.Node, TSESTree.Program>;

const enclosingStatement = (node: NonRootNode): NonRootNode => {
  let current = node;

  while (
    current.parent.type !== TSESTree.AST_NODE_TYPES.BlockStatement &&
    current.parent.type !== TSESTree.AST_NODE_TYPES.Program
  ) {
    current = current.parent;
  }

  return current;
};

const suggestionOf = (
  node: TSESTree.MemberExpression,
  sourceCode: TSESLint.SourceCode
): TSESLint.SuggestionReportDescriptor<MessageIds> => {
  const statement = enclosingStatement(node);
  const indent = indentOf(statement, sourceCode);
  const objectText = sourceCode.getText(node.object);
  const declaration = `const value = ${objectText};\n${indent}`;
  const fix: TSESLint.ReportFixFunction = (fixer) => {
    const hoisted = fixer.insertTextBefore(statement, declaration);
    const replaced = fixer.replaceText(node.object, 'value');
    const fixes = [hoisted, replaced];

    return fixes;
  };
  const suggestion: TSESLint.SuggestionReportDescriptor<MessageIds> = {
    messageId: 'extractReceiver',
    fix
  };

  return suggestion;
};

export default createRule<Options, MessageIds>({
  name: 'chain-receiver-is-name',
  meta,
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      MemberExpression(node): void {
        const isUnnamedReceiver = UNNAMED_RECEIVER_TYPES.has(node.object.type);

        if (!isUnnamedReceiver) return;

        const suggest = [suggestionOf(node, sourceCode)];
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'chainReceiver',
          suggest
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
