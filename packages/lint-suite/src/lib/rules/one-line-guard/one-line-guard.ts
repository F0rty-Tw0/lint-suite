import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { JSONSchema, TSESLint } from '@typescript-eslint/utils';

type OneLineGuardOptions = { readonly maxLineLength: number };
type Options = [OneLineGuardOptions];
type MessageIds = 'oneLineGuard';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require a lone return/throw/continue/break guard to drop its braces when the whole if statement fits on one line'
};

const messages: Record<MessageIds, string> = {
  oneLineGuard:
    'Lone {{ keyword }} guard fits within {{ max }} columns; write it on one line without braces.'
};

const schema: JSONSchema.JSONSchema4[] = [
  {
    type: 'object',
    properties: {
      maxLineLength: { type: 'integer', minimum: 1 }
    },
    additionalProperties: false
  }
];

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  fixable: 'code',
  schema,
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#one-line-guard'
);

const GUARD_KEYWORDS = new Set([
  TSESTree.AST_NODE_TYPES.ReturnStatement,
  TSESTree.AST_NODE_TYPES.ThrowStatement,
  TSESTree.AST_NODE_TYPES.ContinueStatement,
  TSESTree.AST_NODE_TYPES.BreakStatement
]);

const soleStatement = (
  body: TSESTree.Statement
): TSESTree.Statement | undefined => {
  if (body.type !== TSESTree.AST_NODE_TYPES.BlockStatement) return undefined;

  if (body.body.length !== 1) return undefined;

  return body.body[0];
};

const guardStatement = (
  node: TSESTree.IfStatement
): TSESTree.Statement | undefined => {
  if (node.alternate) return undefined;

  const statement = soleStatement(node.consequent);

  if (!statement) return undefined;

  const isGuardKeyword = GUARD_KEYWORDS.has(statement.type);

  if (!isGuardKeyword) return undefined;

  return statement;
};

const headText = (
  node: TSESTree.IfStatement,
  sourceCode: TSESLint.SourceCode
): string => {
  return sourceCode.text
    .slice(node.range[0], node.consequent.range[0])
    .trimEnd();
};

const collapsedLine = (
  node: TSESTree.IfStatement,
  head: string,
  bodyText: string,
  sourceCode: TSESLint.SourceCode
): string => {
  const line = sourceCode.lines[node.loc.start.line - 1];
  const prefix = line.slice(0, node.loc.start.column);

  return `${prefix}${head} ${bodyText}`;
};

export default createRule<Options, MessageIds>({
  name: 'one-line-guard',
  meta,
  defaultOptions: [{ maxLineLength: 80 }],
  create(context, [{ maxLineLength }]) {
    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      IfStatement(node): void {
        const statement = guardStatement(node);

        if (!statement) return;

        const hasComments =
          sourceCode.getCommentsInside(node.consequent).length > 0;

        if (hasComments) return;

        const head = headText(node, sourceCode);
        const isMultiLineHead = head.includes('\n');

        if (isMultiLineHead) return;

        const bodyText = sourceCode.getText(statement);
        const isMultiLineBody = bodyText.includes('\n');

        if (isMultiLineBody) return;

        const collapsed = collapsedLine(node, head, bodyText, sourceCode);

        if (collapsed.length > maxLineLength) return;

        const [keywordToken] = sourceCode.getTokens(statement);
        const keyword = keywordToken.value;
        const data = { keyword, max: maxLineLength };
        const fix: TSESLint.ReportFixFunction = (fixer) =>
          fixer.replaceText(node.consequent, bodyText);
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'oneLineGuard',
          data,
          fix
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
