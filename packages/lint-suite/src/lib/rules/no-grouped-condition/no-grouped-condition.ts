import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'groupedCondition' | 'hoistGroup';

type ReportRoot = { readonly statement: TSESTree.Statement };

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require a mixed-operator group inside a logical condition to be hoisted into a named const'
};

const messages: Record<MessageIds, string> = {
  groupedCondition:
    'This group mixes a different operator than its enclosing condition; hoist it into a named const.',
  hoistGroup: 'Extract the group into a named const.'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  hasSuggestions: true,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#no-grouped-condition'
);

const GROUP_NAME = 'isGroup';

const outermostLogical = (
  node: TSESTree.LogicalExpression
): TSESTree.LogicalExpression => {
  let current = node;

  while (current.parent.type === TSESTree.AST_NODE_TYPES.LogicalExpression) {
    current = current.parent;
  }

  return current;
};

const reportRootOf = (
  node: TSESTree.LogicalExpression
): ReportRoot | undefined => {
  const outermost = outermostLogical(node);
  const { parent } = outermost;

  if (parent.type === TSESTree.AST_NODE_TYPES.IfStatement) {
    if (parent.test !== outermost) return undefined;

    const reportRoot: ReportRoot = { statement: parent };

    return reportRoot;
  }

  if (parent.type !== TSESTree.AST_NODE_TYPES.VariableDeclarator) {
    return undefined;
  }

  const isConstInit = parent.init === outermost && parent.parent.kind === 'const';

  if (!isConstInit) return undefined;

  const reportRoot: ReportRoot = { statement: parent.parent };

  return reportRoot;
};

const suggestionFor = (
  node: TSESTree.LogicalExpression,
  statement: TSESTree.Statement,
  sourceCode: TSESLint.SourceCode
): TSESLint.SuggestionReportDescriptor<MessageIds> => {
  const groupText = sourceCode.getText(node);
  const line = sourceCode.lines[statement.loc.start.line - 1] ?? '';
  const indent = line.slice(0, statement.loc.start.column);
  const declaration = `const ${GROUP_NAME} = ${groupText};\n${indent}`;
  const fix: TSESLint.ReportFixFunction = (fixer) => {
    const hoisted = fixer.insertTextBefore(statement, declaration);
    const replaced = fixer.replaceText(node, GROUP_NAME);
    const fixes = [hoisted, replaced];

    return fixes;
  };
  const suggestion: TSESLint.SuggestionReportDescriptor<MessageIds> = {
    messageId: 'hoistGroup',
    fix
  };

  return suggestion;
};

export default createRule<Options, MessageIds>({
  name: 'no-grouped-condition',
  meta,
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      'LogicalExpression > LogicalExpression'(
        node: TSESTree.LogicalExpression
      ): void {
        const { parent } = node;

        if (parent.type !== TSESTree.AST_NODE_TYPES.LogicalExpression) return;

        const hasSameOperator = node.operator === parent.operator;

        if (hasSameOperator) return;

        const reportRoot = reportRootOf(node);

        if (!reportRoot) return;

        const suggestion = suggestionFor(
          node,
          reportRoot.statement,
          sourceCode
        );
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'groupedCondition',
          suggest: [suggestion]
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
