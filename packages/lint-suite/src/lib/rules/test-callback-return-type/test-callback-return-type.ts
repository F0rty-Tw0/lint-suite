import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'missingReturnType';

type Callback = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

const docs: TSESLint.RuleMetaDataDocs = {
  description: 'Require an explicit return type on test harness callbacks'
};

const messages: Record<MessageIds, string> = {
  missingReturnType: 'Test harness callback is missing an explicit return type.'
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  fixable: 'code',
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#test-callback-return-type'
);

const HARNESS = new Set([
  'describe',
  'it',
  'test',
  'beforeEach',
  'afterEach',
  'beforeAll',
  'afterAll'
]);

const isHarnessCallee = (callee: TSESTree.Expression): boolean => {
  if (callee.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return HARNESS.has(callee.name);
  }

  if (callee.type === TSESTree.AST_NODE_TYPES.MemberExpression) {
    const { object } = callee;

    return object.type === TSESTree.AST_NODE_TYPES.Identifier && HARNESS.has(object.name);
  }

  if (callee.type === TSESTree.AST_NODE_TYPES.CallExpression) {
    return isHarnessCallee(callee.callee);
  }

  return false;
};

const isCallback = (node: TSESTree.CallExpressionArgument): node is Callback => {
  const isArrow = node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression;
  const isFunctionExpression = node.type === TSESTree.AST_NODE_TYPES.FunctionExpression;

  return isArrow || isFunctionExpression;
};

const isCloseParen = (token: TSESTree.Token): boolean => token.value === ')';

const closingParenOf = (
  node: Callback,
  sourceCode: TSESLint.SourceCode
): TSESTree.Token | undefined => {
  const token = sourceCode.getTokenBefore(node.body, { filter: isCloseParen });

  if (!token) return undefined;

  const isInsideNode = token.range[0] >= node.range[0];

  if (!isInsideNode) return undefined;

  return token;
};

type AutoFix = { readonly fix?: TSESLint.ReportFixFunction };

const autoFixOf = (node: Callback, sourceCode: TSESLint.SourceCode): AutoFix => {
  const closingParen = closingParenOf(node, sourceCode);

  if (!closingParen) {
    const noAutoFix: AutoFix = {};

    return noAutoFix;
  }

  const returnType = node.async ? ': Promise<void>' : ': void';
  const fix: TSESLint.ReportFixFunction = (fixer) =>
    fixer.insertTextAfter(closingParen, returnType);
  const autoFix: AutoFix = { fix };

  return autoFix;
};

export default createRule<Options, MessageIds>({
  name: 'test-callback-return-type',
  meta,
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      CallExpression(node): void {
        const isHarness = isHarnessCallee(node.callee);

        if (!isHarness) return;

        const checkArgument = (argument: TSESTree.CallExpressionArgument): void => {
          if (!isCallback(argument)) return;

          if (argument.returnType) return;

          const autoFix = autoFixOf(argument, sourceCode);
          const report: TSESLint.ReportDescriptor<MessageIds> = {
            node: argument,
            messageId: 'missingReturnType',
            ...autoFix
          };

          context.report(report);
        };

        node.arguments.forEach(checkArgument);
      }
    };

    return listeners;
  }
});
