import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  MOCK_FILE_PATTERN,
  MOCK_NAME_PATTERN,
  TESTING_LIB_SEGMENT
} from './common/test-file-shape.const.ts';
import type { MessageIds, Options } from './common/test-file-shape.type.ts';

type RuleContext = TSESLint.RuleContext<MessageIds, Options>;

export const isMockFile = (filename: string): boolean => {
  const isUnderTestMocks = MOCK_FILE_PATTERN.test(filename);

  if (isUnderTestMocks) return true;

  const isUnderTestingLib = filename.includes(TESTING_LIB_SEGMENT);

  return isUnderTestingLib && filename.endsWith('.mock.ts');
};

const isMockIdentifier = (
  id: TSESTree.VariableDeclarator['id']
): id is TSESTree.Identifier => id.type === TSESTree.AST_NODE_TYPES.Identifier;

const isMockFunction = (
  init: TSESTree.Expression | null
): init is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression => {
  if (init === null) return false;

  const { type } = init;

  if (type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression) return true;

  return type === TSESTree.AST_NODE_TYPES.FunctionExpression;
};

const isConstVariableDeclaration = (
  declaration: TSESTree.NamedExportDeclarations
): declaration is TSESTree.VariableDeclaration => {
  if (declaration.type !== TSESTree.AST_NODE_TYPES.VariableDeclaration) {
    return false;
  }

  return declaration.kind === 'const';
};

const declarationName = (
  context: Readonly<RuleContext>,
  declaration: TSESTree.NamedExportDeclarations
): string => {
  if (declaration.type === TSESTree.AST_NODE_TYPES.VariableDeclaration) {
    const [firstDeclarator] = declaration.declarations;

    return context.sourceCode.getText(firstDeclarator.id);
  }

  if ('id' in declaration && declaration.id !== null) {
    return context.sourceCode.getText(declaration.id);
  }

  return context.sourceCode.getText(declaration);
};

const reportMock = (
  context: Readonly<RuleContext>,
  node: TSESTree.Node,
  messageId: MessageIds,
  name: string
): void => {
  const data = { name };
  const descriptor: TSESLint.ReportDescriptor<MessageIds> = {
    node,
    messageId,
    data
  };

  context.report(descriptor);
};

const checkMockDeclarator = (
  context: Readonly<RuleContext>,
  node: TSESTree.VariableDeclarator
): void => {
  const fallbackName = context.sourceCode.getText(node.id);
  const name = isMockIdentifier(node.id) ? node.id.name : fallbackName;
  const hasValidPattern = MOCK_NAME_PATTERN.test(name);
  const hasValidName = isMockIdentifier(node.id) && hasValidPattern;

  if (!hasValidName) {
    reportMock(context, node.id, 'mockName', name);
  }

  if (!isMockFunction(node.init)) {
    reportMock(context, node.id, 'mockFactory', name);

    return;
  }

  const hasReturnType = node.init.returnType !== undefined;

  if (hasReturnType) return;

  reportMock(context, node.id, 'mockReturnType', name);
};

export const mockExportListeners = (
  context: Readonly<RuleContext>
): TSESLint.RuleListener => {
  const listeners: TSESLint.RuleListener = {
    ExportNamedDeclaration(node): void {
      if (node.declaration === null) return;

      const { declaration } = node;
      const isConstVar = isConstVariableDeclaration(declaration);

      if (!isConstVar) {
        const name = declarationName(context, declaration);

        reportMock(context, node, 'mockFactory', name);

        return;
      }

      for (const declarator of declaration.declarations) {
        checkMockDeclarator(context, declarator);
      }
    }
  };

  return listeners;
};
