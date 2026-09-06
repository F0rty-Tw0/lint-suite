import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { indentOf } from '../utils/indent-of.util.ts';

type Options = [];
type MessageIds = 'inlineReturnObject';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require an inline returned object literal to be named as a constant first'
};

const messages: Record<MessageIds, string> = {
  inlineReturnObject:
    'Object literal is returned inline; name it as a constant first.'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  hasSuggestions: true,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#no-inline-return-object'
);

const wrappingRange = (
  objectExpression: TSESTree.ObjectExpression,
  sourceCode: TSESLint.SourceCode
): Readonly<[number, number]> => {
  const before = sourceCode.getTokenBefore(objectExpression);
  const after = sourceCode.getTokenAfter(objectExpression);
  const isWrapped = before?.value === '(' && after?.value === ')';

  if (!isWrapped) return objectExpression.range;

  return [before.range[0], after.range[1]];
};

const returnSuggestion = (
  node: TSESTree.ReturnStatement,
  objectExpression: TSESTree.ObjectExpression,
  sourceCode: TSESLint.SourceCode
): TSESLint.SuggestionReportDescriptor<MessageIds> => {
  const indent = indentOf(node, sourceCode);
  const objectText = sourceCode.getText(objectExpression);
  const fix: TSESLint.ReportFixFunction = (fixer) => {
    const declaration = fixer.insertTextBefore(
      node,
      `const result = ${objectText};\n\n${indent}`
    );
    const replaced = fixer.replaceText(objectExpression, 'result');
    const fixes = [declaration, replaced];

    return fixes;
  };
  const suggestion: TSESLint.SuggestionReportDescriptor<MessageIds> = {
    messageId: 'inlineReturnObject',
    fix
  };

  return suggestion;
};

const arrowSuggestion = (
  node: TSESTree.ArrowFunctionExpression,
  objectExpression: TSESTree.ObjectExpression,
  sourceCode: TSESLint.SourceCode
): TSESLint.SuggestionReportDescriptor<MessageIds> => {
  const indent = indentOf(node, sourceCode);
  const bodyIndent = `${indent}  `;
  const objectText = sourceCode.getText(objectExpression);
  const replacement = `{\n${bodyIndent}const result = ${objectText};\n\n${bodyIndent}return result;\n${indent}}`;
  const range = wrappingRange(objectExpression, sourceCode);
  const fix: TSESLint.ReportFixFunction = (fixer) =>
    fixer.replaceTextRange(range, replacement);
  const suggestion: TSESLint.SuggestionReportDescriptor<MessageIds> = {
    messageId: 'inlineReturnObject',
    fix
  };

  return suggestion;
};

export default createRule<Options, MessageIds>({
  name: 'no-inline-return-object',
  meta,
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      ReturnStatement(node): void {
        if (node.argument?.type !== TSESTree.AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        const objectExpression = node.argument;
        const suggest = [returnSuggestion(node, objectExpression, sourceCode)];
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'inlineReturnObject',
          suggest
        };

        context.report(report);
      },
      ArrowFunctionExpression(node): void {
        if (!node.expression) return;

        if (node.body.type !== TSESTree.AST_NODE_TYPES.ObjectExpression) return;

        const objectExpression = node.body;
        const suggest = [arrowSuggestion(node, objectExpression, sourceCode)];
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'inlineReturnObject',
          suggest
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
