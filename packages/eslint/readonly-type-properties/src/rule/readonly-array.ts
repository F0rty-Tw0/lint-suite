import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import type {
  MessageIds,
  Options
} from './common/readonly-type-properties.type.ts';

type RuleContext = Readonly<TSESLint.RuleContext<MessageIds, Options>>;

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
  replacement: string
): TSESLint.ReportDescriptor<MessageIds> => {
  const data = { replacement };
  const fix: TSESLint.ReportFixFunction = (fixer) =>
    fixer.replaceText(node, replacement);
  const useMutableArray: TSESLint.SuggestionReportDescriptor<MessageIds> = {
    messageId: 'useMutableArray',
    data,
    fix
  };
  const report: TSESLint.ReportDescriptor<MessageIds> = {
    node,
    messageId: 'readonlyArray',
    suggest: [useMutableArray]
  };

  return report;
};

export const readonlyArrayListeners = (
  context: RuleContext
): TSESLint.RuleListener => {
  const { sourceCode } = context;

  const listeners: TSESLint.RuleListener = {
    TSTypeOperator(node): void {
      if (node.operator !== 'readonly' || !node.typeAnnotation) return;

      const isArray =
        node.typeAnnotation.type === TSESTree.AST_NODE_TYPES.TSArrayType;

      if (!isArray) return;

      const replacement = sourceCode.getText(node.typeAnnotation);

      context.report(readonlyArrayReport(node, replacement));
    },
    TSTypeReference(node): void {
      if (node.typeName.type !== TSESTree.AST_NODE_TYPES.Identifier) return;

      if (node.typeName.name !== 'ReadonlyArray') return;

      const params = node.typeArguments?.params ?? [];

      if (params.length !== 1) return;

      const [argument] = params;

      if (!argument) return;

      const replacement = arrayTypeText(argument, sourceCode);

      context.report(readonlyArrayReport(node, replacement));
    }
  };

  return listeners;
};
