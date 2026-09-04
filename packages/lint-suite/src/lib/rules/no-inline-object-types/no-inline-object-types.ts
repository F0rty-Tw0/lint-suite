import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'inlineObjectType';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require nested object types inside a type alias to be extracted to a named type alias'
};

const messages: Record<MessageIds, string> = {
  inlineObjectType:
    'Inline object type must be extracted to a named type alias.'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#no-inline-object-types'
);

const enclosingTypeAlias = (
  node: TSESTree.Node
): TSESTree.TSTypeAliasDeclaration | undefined => {
  let current: TSESTree.Node | undefined = node.parent;

  while (current && current.type !== TSESTree.AST_NODE_TYPES.Program) {
    if (current.type === TSESTree.AST_NODE_TYPES.TSTypeAliasDeclaration) {
      return current;
    }

    current = current.parent;
  }

  return undefined;
};

export default createRule<Options, MessageIds>({
  name: 'no-inline-object-types',
  meta,
  defaultOptions: [],
  create(context) {
    const listeners: TSESLint.RuleListener = {
      TSTypeLiteral(node): void {
        const isAliasBody =
          node.parent.type === TSESTree.AST_NODE_TYPES.TSTypeAliasDeclaration;

        if (isAliasBody) return;

        const enclosingAlias = enclosingTypeAlias(node);

        if (!enclosingAlias) return;

        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'inlineObjectType'
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
