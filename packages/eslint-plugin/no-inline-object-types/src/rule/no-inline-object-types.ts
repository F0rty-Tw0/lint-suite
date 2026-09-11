import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'inlineObjectType';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require every object type literal to be the body of a named type alias'
};

const messages: Record<MessageIds, string> = {
  inlineObjectType:
    'Object type literal must be the body of a named type alias.'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint-plugin/no-inline-object-types#readme'
);

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
