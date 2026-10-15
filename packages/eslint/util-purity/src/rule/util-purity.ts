import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  AMBIENT_REFERENCE_NAMES,
  AMBIENT_SELECTOR,
  CALL_SELECTOR,
  MODULE_LET_SELECTOR,
  MODULE_SOURCE_SELECTOR,
  MODULE_STATE_SELECTOR,
  NEW_DATE_SELECTOR,
  NONDETERMINISTIC_SELECTOR,
  defaultOptions,
  meta
} from './common/util-purity.const.ts';
import type {
  MessageIds,
  ModuleSourceNode,
  Options
} from './common/util-purity.type.ts';
import { ambientAliases } from './utils/ambient-alias.util.ts';
import { runtimeModuleSource } from './utils/module-source.util.ts';
import { isProductionUtilFile } from './utils/util-file.util.ts';

type RuleContext = TSESLint.RuleContext<MessageIds, Options>;

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint/util-purity#readme'
);

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

const reportSource = (
  context: Readonly<RuleContext>,
  node: ModuleSourceNode,
  banned: Set<string>
): void => {
  const source = runtimeModuleSource(node);

  if (source === undefined) return;

  const isBanned = banned.has(source);

  if (!isBanned) return;

  report(context, node, 'impureImport', { source });
};

const reportAliases = (
  context: Readonly<RuleContext>,
  program: TSESTree.Program
): void => {
  const scope = context.sourceCode.getScope(program);
  const aliases = ambientAliases(scope, AMBIENT_REFERENCE_NAMES);

  for (const alias of aliases) {
    report(context, alias, 'ambientAccess', { name: alias.name });
  }
};

export default createRule<Options, MessageIds>({
  name: 'util-purity',
  meta,
  defaultOptions,
  create(context, [{ bannedModules }]) {
    const isUtil = isProductionUtilFile(context.filename);

    if (!isUtil) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    const banned = new Set(bannedModules);

    const listeners: TSESLint.RuleListener = {
      Program(node): void {
        reportAliases(context, node);
      },
      [MODULE_SOURCE_SELECTOR](node: ModuleSourceNode): void {
        reportSource(context, node, banned);
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
      [NEW_DATE_SELECTOR](node: TSESTree.NewExpression): void {
        report(context, node, 'nondeterministic', { name: 'new Date()' });
      },
      [CALL_SELECTOR](node: TSESTree.CallExpression): void {
        reportCall(context, node);
      }
    };

    return listeners;
  }
});
