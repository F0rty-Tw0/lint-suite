import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  STUB_FILE_PATTERN,
  STUB_NAME_PATTERN,
  TESTING_LIB_SEGMENT
} from './common/test-file-shape.const.ts';
import type { MessageIds, Options } from './common/test-file-shape.type.ts';

type RuleContext = TSESLint.RuleContext<MessageIds, Options>;

export const isStubFile = (filename: string): boolean => {
  const isUnderTestStubs = STUB_FILE_PATTERN.test(filename);

  if (isUnderTestStubs) return true;

  const isUnderTestingLib = filename.includes(TESTING_LIB_SEGMENT);

  return isUnderTestingLib && filename.endsWith('.stub.ts');
};

const isStubIdentifier = (
  id: TSESTree.VariableDeclarator['id']
): id is TSESTree.Identifier => id.type === TSESTree.AST_NODE_TYPES.Identifier;

const checkStubDeclarator = (
  context: Readonly<RuleContext>,
  node: TSESTree.VariableDeclarator
): void => {
  const fallbackName = context.sourceCode.getText(node.id);
  const name = isStubIdentifier(node.id) ? node.id.name : fallbackName;
  const hasValidPattern = STUB_NAME_PATTERN.test(name);
  const hasValidName = isStubIdentifier(node.id) && hasValidPattern;

  if (!hasValidName) {
    const nameData = { name };
    const nameReport: TSESLint.ReportDescriptor<MessageIds> = {
      node: node.id,
      messageId: 'stubName',
      data: nameData
    };

    context.report(nameReport);
  }

  const hasTypeAnnotation = node.id.typeAnnotation !== undefined;

  if (hasTypeAnnotation) return;

  const typeData = { name };
  const typeReport: TSESLint.ReportDescriptor<MessageIds> = {
    node: node.id,
    messageId: 'stubType',
    data: typeData
  };

  context.report(typeReport);
};

export const stubExportListeners = (
  context: Readonly<RuleContext>
): TSESLint.RuleListener => {
  const listeners: TSESLint.RuleListener = {
    'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator'(
      node: TSESTree.VariableDeclarator
    ): void {
      checkStubDeclarator(context, node);
    }
  };

  return listeners;
};
