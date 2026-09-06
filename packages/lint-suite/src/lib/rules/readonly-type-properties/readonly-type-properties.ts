import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'missingReadonly' | 'readonlyArray';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require readonly on primitive-typed type and interface properties, and require array types to be written as T[] instead of readonly T[] or ReadonlyArray<T>'
};

const messages: Record<MessageIds, string> = {
  missingReadonly:
    "Type property '{{ name }}' should be readonly. Disable this rule on the line if mutation is required.",
  readonlyArray: 'Write a readonly array type as T[].'
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

const NEEDS_PARENS = new Set([
  TSESTree.AST_NODE_TYPES.TSUnionType,
  TSESTree.AST_NODE_TYPES.TSIntersectionType,
  TSESTree.AST_NODE_TYPES.TSFunctionType,
  TSESTree.AST_NODE_TYPES.TSConditionalType
]);

const arrayTypeText = (
  argument: TSESTree.TypeNode,
  sourceCode: TSESLint.SourceCode
): string => {
  const argumentText = sourceCode.getText(argument);
  const needsParens = NEEDS_PARENS.has(argument.type);

  if (needsParens) return `(${argumentText})[]`;

  return `${argumentText}[]`;
};

const readonlyArrayReport = (
  node: TSESTree.Node,
  fix: TSESLint.ReportFixFunction
): TSESLint.ReportDescriptor<MessageIds> => {
  const report: TSESLint.ReportDescriptor<MessageIds> = {
    node,
    messageId: 'readonlyArray',
    fix
  };

  return report;
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
      },
      TSTypeOperator(node): void {
        if (node.operator !== 'readonly' || !node.typeAnnotation) return;

        const isArray =
          node.typeAnnotation.type === TSESTree.AST_NODE_TYPES.TSArrayType;

        if (!isArray) return;

        const replacement = sourceCode.getText(node.typeAnnotation);
        const fix: TSESLint.ReportFixFunction = (fixer) =>
          fixer.replaceText(node, replacement);

        context.report(readonlyArrayReport(node, fix));
      },
      TSTypeReference(node): void {
        if (node.typeName.type !== TSESTree.AST_NODE_TYPES.Identifier) return;

        if (node.typeName.name !== 'ReadonlyArray') return;

        const params = node.typeArguments?.params ?? [];

        if (params.length !== 1) return;

        const [argument] = params;

        if (!argument) return;

        const replacement = arrayTypeText(argument, sourceCode);
        const fix: TSESLint.ReportFixFunction = (fixer) =>
          fixer.replaceText(node, replacement);

        context.report(readonlyArrayReport(node, fix));
      }
    };

    return listeners;
  }
});
