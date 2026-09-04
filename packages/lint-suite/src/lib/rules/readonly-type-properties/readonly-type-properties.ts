import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'missingReadonly';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require readonly on primitive-typed type and interface properties'
};

const messages: Record<MessageIds, string> = {
  missingReadonly:
    "Type property '{{ name }}' should be readonly. Disable this rule on the line if mutation is required."
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  fixable: 'code',
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#readonly-type-properties'
);

const propertyName = (
  node: TSESTree.TSPropertySignature,
  sourceCode: TSESLint.SourceCode
): string => {
  if (node.key.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return node.key.name;
  }

  return sourceCode.getText(node.key);
};

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
  const isPrimitiveKeyword = PRIMITIVE_KEYWORDS.has(type.type);

  if (isPrimitiveKeyword) return true;

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

const readonlyFix = (
  node: TSESTree.TSPropertySignature,
  sourceCode: TSESLint.SourceCode
): TSESLint.ReportFixFunction => {
  return (fixer) => {
    const firstToken = sourceCode.getFirstToken(node);

    if (!firstToken) return null;

    return fixer.insertTextBefore(firstToken, 'readonly ');
  };
};

export default createRule<Options, MessageIds>({
  name: 'readonly-type-properties',
  meta,
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      TSPropertySignature(node): void {
        if (node.readonly || !node.typeAnnotation) return;

        const isPrimitiveType = isPrimitive(node.typeAnnotation.typeAnnotation);

        if (!isPrimitiveType) return;

        const name = propertyName(node, sourceCode);
        const data = { name };
        const fix = readonlyFix(node, sourceCode);
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node: node.key,
          messageId: 'missingReadonly',
          data,
          fix
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
