import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { enclosingStatement } from '../utils/enclosing-statement.util.ts';
import { indentOf } from '../utils/indent-of.util.ts';

type Options = [];
type MessageIds = 'spreadExpression';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require a spread argument to be an identifier or member access, not an inline expression'
};

const messages: Record<MessageIds, string> = {
  spreadExpression:
    'Spread argument is an inline expression; name it as a constant first.'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  hasSuggestions: true,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#no-spread-expression'
);

const ALLOWED_ARGUMENT_TYPES = new Set([
  TSESTree.AST_NODE_TYPES.Identifier,
  TSESTree.AST_NODE_TYPES.MemberExpression
]);

export default createRule<Options, MessageIds>({
  name: 'no-spread-expression',
  meta,
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      SpreadElement(node): void {
        const isAllowed = ALLOWED_ARGUMENT_TYPES.has(node.argument.type);

        if (isAllowed) return;

        const statement = enclosingStatement(node);
        const indent = indentOf(statement, sourceCode);
        const argumentText = sourceCode.getText(node.argument);
        const fix: TSESLint.ReportFixFunction = (fixer) => {
          const declaration = fixer.insertTextBefore(
            statement,
            `const spread = ${argumentText};\n${indent}`
          );
          const replaced = fixer.replaceText(node.argument, 'spread');
          const fixes = [declaration, replaced];

          return fixes;
        };
        const suggestion: TSESLint.SuggestionReportDescriptor<MessageIds> = {
          messageId: 'spreadExpression',
          fix
        };
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'spreadExpression',
          suggest: [suggestion]
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
