import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import type {
  MessageIds,
  Options
} from './common/readonly-type-properties.type.ts';
import { readonlyArrayListeners } from './readonly-array.ts';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require readonly on primitive-typed type and interface properties, and require array types to be written as T[] instead of readonly T[] or ReadonlyArray<T>'
};

const messages: Record<MessageIds, string> = {
  addReadonly: "Add readonly to '{{ name }}'.",
  missingReadonly:
    "Type property '{{ name }}' should be readonly. Disable this rule on the line if mutation is required.",
  readonlyArray:
    'Write a readonly array type as T[]. Disable this rule on the line if a readonly value is assigned to it.',
  useMutableArray: "Replace with '{{ replacement }}'."
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  hasSuggestions: true,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint/readonly-type-properties#readme'
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
    const arrayListeners = readonlyArrayListeners(context);

    const listeners: TSESLint.RuleListener = {
      ...arrayListeners,
      TSPropertySignature(node): void {
        if (node.readonly || !node.typeAnnotation) return;

        const isPrimitiveType = isPrimitive(node.typeAnnotation.typeAnnotation);

        if (!isPrimitiveType) return;

        const name = propertyName(node, sourceCode);
        const data = { name };
        const fix = readonlyFix(node, sourceCode);
        const addReadonly: TSESLint.SuggestionReportDescriptor<MessageIds> = {
          messageId: 'addReadonly',
          data,
          fix
        };
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node: node.key,
          messageId: 'missingReadonly',
          data,
          suggest: [addReadonly]
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
