import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'missingReadonly';

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#readonly-type-properties'
);

const propertyName = (
  node: TSESTree.TSPropertySignature,
  sourceCode: TSESLint.SourceCode
): string =>
  node.key.type === TSESTree.AST_NODE_TYPES.Identifier
    ? node.key.name
    : sourceCode.getText(node.key);

const PRIMITIVE_KEYWORDS = new Set([
  TSESTree.AST_NODE_TYPES.TSStringKeyword,
  TSESTree.AST_NODE_TYPES.TSNumberKeyword,
  TSESTree.AST_NODE_TYPES.TSBooleanKeyword,
  TSESTree.AST_NODE_TYPES.TSBigIntKeyword,
  TSESTree.AST_NODE_TYPES.TSSymbolKeyword,
  TSESTree.AST_NODE_TYPES.TSNullKeyword,
  TSESTree.AST_NODE_TYPES.TSUndefinedKeyword
]);

const isPrimitive = (type: TSESTree.TypeNode): boolean => {
  if (PRIMITIVE_KEYWORDS.has(type.type)) {
    return true;
  }

  if (
    type.type === TSESTree.AST_NODE_TYPES.TSLiteralType ||
    type.type === TSESTree.AST_NODE_TYPES.TSTemplateLiteralType
  ) {
    return true;
  }

  if (
    type.type === TSESTree.AST_NODE_TYPES.TSUnionType ||
    type.type === TSESTree.AST_NODE_TYPES.TSIntersectionType
  ) {
    return type.types.every(isPrimitive);
  }

  return false;
};

export default createRule<Options, MessageIds>({
  name: 'readonly-type-properties',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require readonly on primitive-typed type and interface properties'
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingReadonly:
        "Type property '{{ name }}' should be readonly. Disable this rule on the line if mutation is required."
    }
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    return {
      TSPropertySignature(node): void {
        if (node.readonly || !node.typeAnnotation) {
          return;
        }

        if (!isPrimitive(node.typeAnnotation.typeAnnotation)) {
          return;
        }

        context.report({
          node: node.key,
          messageId: 'missingReadonly',
          data: { name: propertyName(node, sourceCode) },
          fix(fixer) {
            const firstToken = sourceCode.getFirstToken(node);

            return firstToken
              ? fixer.insertTextBefore(firstToken, 'readonly ')
              : null;
          }
        });
      }
    };
  }
});
