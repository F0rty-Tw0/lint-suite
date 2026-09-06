import { ASTUtils, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { JSONSchema, TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'arrowBodyWrapped';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require an expression-bodied arrow function to fit on one line'
};

const messages: Record<MessageIds, string> = {
  arrowBodyWrapped:
    'Expression body of this arrow function spans multiple lines; wrap it in a block with an explicit return.'
};

const schema: JSONSchema.JSONSchema4[] = [];

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  fixable: 'code',
  schema,
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#arrow-body-fits-line'
);

const isMultiLine = (body: TSESTree.Expression): boolean =>
  body.loc.start.line !== body.loc.end.line;

const arrowIndent = (
  node: TSESTree.ArrowFunctionExpressionWithExpressionBody,
  sourceCode: TSESLint.SourceCode
): string => {
  const line = sourceCode.lines[node.loc.start.line - 1] ?? '';
  const leadingWhitespace = /^\s*/u.exec(line);

  return leadingWhitespace ? leadingWhitespace[0] : '';
};

const wrappedBody = (indent: string, bodyText: string): string => {
  const innerIndent = `${indent}  `;

  return `{\n${innerIndent}return ${bodyText};\n${indent}}`;
};

const replacementRange = (
  node: TSESTree.ArrowFunctionExpressionWithExpressionBody,
  sourceCode: TSESLint.SourceCode
): Readonly<TSESTree.Range> => {
  const isParenthesized = ASTUtils.isParenthesized(node.body, sourceCode);

  if (!isParenthesized) return node.body.range;

  const openParen = sourceCode.getTokenBefore(node.body);
  const closeParen = sourceCode.getTokenAfter(node.body);

  if (!openParen || !closeParen) return node.body.range;

  return [openParen.range[0], closeParen.range[1]];
};

export default createRule<Options, MessageIds>({
  name: 'arrow-body-fits-line',
  meta,
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      'ArrowFunctionExpression[expression=true]'(
        node: TSESTree.ArrowFunctionExpressionWithExpressionBody
      ): void {
        const isObjectBody =
          node.body.type === TSESTree.AST_NODE_TYPES.ObjectExpression;

        if (isObjectBody) return;

        const isMultiLineBody = isMultiLine(node.body);

        if (!isMultiLineBody) return;

        const indent = arrowIndent(node, sourceCode);
        const bodyText = sourceCode.getText(node.body);
        const range = replacementRange(node, sourceCode);
        const fix: TSESLint.ReportFixFunction = (fixer) =>
          fixer.replaceTextRange(range, wrappedBody(indent, bodyText));
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'arrowBodyWrapped',
          fix
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
