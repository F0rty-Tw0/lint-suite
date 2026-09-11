import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { JSONSchema, TSESLint } from '@typescript-eslint/utils';

type MaxConditionOperandsOptions = { readonly max: number };
type Options = [MaxConditionOperandsOptions];
type MessageIds = 'tooManyOperands';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Limit the number of operands in an if statement condition to keep it readable'
};

const messages: Record<MessageIds, string> = {
  tooManyOperands:
    'This condition has {{ count }} operands; extract it into a named const when it exceeds {{ max }}.'
};

const maxSchema: JSONSchema.JSONSchema4 = { type: 'integer', minimum: 1 };

const properties: Record<string, JSONSchema.JSONSchema4> = {
  max: maxSchema
};

const optionsSchema: JSONSchema.JSONSchema4 = {
  type: 'object',
  properties,
  additionalProperties: false
};

const schema: JSONSchema.JSONSchema4[] = [optionsSchema];

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  schema,
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint-plugin/max-condition-operands#readme'
);

const countOperands = (node: TSESTree.Expression): number => {
  if (node.type !== TSESTree.AST_NODE_TYPES.LogicalExpression) return 1;

  return countOperands(node.left) + countOperands(node.right);
};

const defaultOptions: Options = [{ max: 3 }];

export default createRule<Options, MessageIds>({
  name: 'max-condition-operands',
  meta,
  defaultOptions,
  create(context, [{ max }]) {
    const listeners: TSESLint.RuleListener = {
      IfStatement(node): void {
        const count = countOperands(node.test);

        if (count <= max) return;

        const data = { count, max };
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node: node.test,
          messageId: 'tooManyOperands',
          data
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
