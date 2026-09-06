import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  AMBIENT_SELECTOR,
  CALL_SELECTOR,
  MODULE_LET_SELECTOR,
  MODULE_STATE_SELECTOR,
  NONDETERMINISTIC_SELECTOR,
  defaultOptions,
  meta
} from './common/util-purity.const.ts';
import type { MessageIds, Options } from './common/util-purity.type.ts';

type RuleContext = TSESLint.RuleContext<MessageIds, Options>;

const UTIL_FILE = /\/utils\/[^/]+\.util\.ts$/;
const TEST_SEGMENT = '/test/';
const TESTING_SEGMENT = '/testing/';

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#util-purity'
);

const isUtilFile = (filename: string): boolean => {
  const isUtilPath = UTIL_FILE.test(filename);

  if (!isUtilPath) return false;

  const isUnderTest = filename.includes(TEST_SEGMENT) || filename.includes(TESTING_SEGMENT);

  return !isUnderTest;
};

const identifierName = (
  node: TSESTree.Expression | TSESTree.PrivateIdentifier
): string | undefined => {
  if (node.type !== TSESTree.AST_NODE_TYPES.Identifier) return undefined;

  return node.name;
};

const memberName = (node: TSESTree.MemberExpression): string | undefined => {
  const objectName = identifierName(node.object);

  if (objectName === undefined) return undefined;

  const propertyName = identifierName(node.property);

  if (propertyName === undefined) return undefined;

  return `${objectName}.${propertyName}`;
};

const report = (
  context: Readonly<RuleContext>,
  node: TSESTree.Node,
  messageId: MessageIds,
  data: Record<string, string> | undefined
): void => {
  const base: TSESLint.ReportDescriptor<MessageIds> = { node, messageId };

  if (data === undefined) {
    context.report(base);

    return;
  }

  const withData: TSESLint.ReportDescriptor<MessageIds> = {
    node,
    messageId,
    data
  };

  context.report(withData);
};

const reportAmbient = (
  context: Readonly<RuleContext>,
  node: TSESTree.MemberExpression
): void => {
  const name = identifierName(node.object);

  if (name === undefined) return;

  report(context, node, 'ambientAccess', { name });
};

const reportNondeterministic = (
  context: Readonly<RuleContext>,
  node: TSESTree.MemberExpression
): void => {
  const name = memberName(node);

  if (name === undefined) return;

  report(context, node, 'nondeterministic', { name });
};

const reportCall = (
  context: Readonly<RuleContext>,
  node: TSESTree.CallExpression
): void => {
  const name = identifierName(node.callee);

  if (name === undefined) return;

  report(context, node, 'impureCall', { name });
};

const handleImport = (
  context: Readonly<RuleContext>,
  node: TSESTree.ImportDeclaration,
  banned: Set<string>
): void => {
  const { source } = node;
  const isBanned = banned.has(source.value);

  if (!isBanned) return;

  report(context, node, 'impureImport', { source: source.value });
};

export default createRule<Options, MessageIds>({
  name: 'util-purity',
  meta,
  defaultOptions,
  create(context, [{ bannedModules }]) {
    const filename = context.filename.replaceAll('\\', '/');
    const isUtil = isUtilFile(filename);

    if (!isUtil) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    const banned = new Set(bannedModules);

    const listeners: TSESLint.RuleListener = {
      ImportDeclaration(node): void {
        handleImport(context, node, banned);
      },
      [MODULE_LET_SELECTOR](node: TSESTree.VariableDeclaration): void {
        report(context, node, 'moduleLet', undefined);
      },
      [MODULE_STATE_SELECTOR](node: TSESTree.NewExpression): void {
        report(context, node, 'moduleState', undefined);
      },
      [AMBIENT_SELECTOR](node: TSESTree.MemberExpression): void {
        reportAmbient(context, node);
      },
      [NONDETERMINISTIC_SELECTOR](node: TSESTree.MemberExpression): void {
        reportNondeterministic(context, node);
      },
      [CALL_SELECTOR](node: TSESTree.CallExpression): void {
        reportCall(context, node);
      }
    };

    return listeners;
  }
});
