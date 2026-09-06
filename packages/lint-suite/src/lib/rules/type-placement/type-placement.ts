import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { defaultOptions, meta } from './common/type-placement.const.ts';
import type { MessageIds, Options } from './common/type-placement.type.ts';
import { toRegExp } from '../utils/to-regexp.util.ts';

type RuleContext = TSESLint.RuleContext<MessageIds, Options>;

type FileShape = {
  readonly isTypeFile: boolean;
  readonly isConstFile: boolean;
  readonly inCommon: boolean;
};

const TYPE_FILE_SUFFIX = '.type.ts';
const CONST_FILE_SUFFIX = '.const.ts';
const COMMON_SEGMENT = '/common/';
const EXEMPT_FILE = /\.(spec|stub|spec\.util|d)\.ts$/;
const FIXTURES_SEGMENT = '/fixtures/';
const TYPE_FILE_SEGMENT = /\.type(\.ts)?$/;

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#type-placement'
);

const isExemptFile = (filename: string): boolean => {
  const isExemptSuffix = EXEMPT_FILE.test(filename);

  if (isExemptSuffix) return true;

  return filename.includes(FIXTURES_SEGMENT);
};

const lastSegment = (source: string): string => {
  const segments = source.split('/');

  return segments[segments.length - 1] ?? source;
};

const isFromTypeFile = (source: string): boolean =>
  TYPE_FILE_SEGMENT.test(lastSegment(source));

const isInternalSource = (source: string, patterns: RegExp[]): boolean => {
  const isRelative = source.startsWith('.');

  if (isRelative) return true;

  return patterns.some((pattern) => pattern.test(source));
};

const isTypeDeclaration = (
  declaration: TSESTree.NamedExportDeclarations
): declaration is
  TSESTree.TSTypeAliasDeclaration | TSESTree.TSInterfaceDeclaration => {
  const { type } = declaration;

  if (type === TSESTree.AST_NODE_TYPES.TSTypeAliasDeclaration) return true;

  return type === TSESTree.AST_NODE_TYPES.TSInterfaceDeclaration;
};

const isConstVariableDeclaration = (
  declaration: TSESTree.NamedExportDeclarations
): boolean => {
  if (declaration.type !== TSESTree.AST_NODE_TYPES.VariableDeclaration) {
    return false;
  }

  return declaration.kind === 'const';
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

const handleExport = (
  context: Readonly<RuleContext>,
  node: TSESTree.ExportNamedDeclaration,
  shape: FileShape
): void => {
  if (node.declaration === null) return;

  const { declaration } = node;

  if (isTypeDeclaration(declaration)) {
    const isCommonTypeFile = shape.isTypeFile && shape.inCommon;

    if (!isCommonTypeFile) {
      const data = { name: declaration.id.name };

      report(context, node, 'typeOutsideTypeFile', data);
    }
  } else if (shape.isTypeFile) {
    report(context, node, 'valueInTypeFile', undefined);
  }

  const isConstVar = isConstVariableDeclaration(declaration);

  if (shape.isConstFile && !isConstVar) {
    report(context, node, 'nonConstInConstFile', undefined);
  }
};

const handleTypeImport = (
  context: Readonly<RuleContext>,
  node: TSESTree.ImportDeclaration,
  patterns: RegExp[]
): void => {
  const { value: source } = node.source;
  const isInternal = isInternalSource(source, patterns);

  if (!isInternal) return;

  const isTypeSource = isFromTypeFile(source);

  if (isTypeSource) return;

  report(context, node, 'typeImportNotFromTypeFile', { source });
};

export default createRule<Options, MessageIds>({
  name: 'type-placement',
  meta,
  defaultOptions,
  create(context, [{ internalPatterns }]) {
    const filename = context.filename.replaceAll('\\', '/');
    const isExempt = isExemptFile(filename);

    if (isExempt) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    const isTypeFile = filename.endsWith(TYPE_FILE_SUFFIX);
    const isConstFile = filename.endsWith(CONST_FILE_SUFFIX);
    const inCommon = filename.includes(COMMON_SEGMENT);
    const shape: FileShape = { isTypeFile, isConstFile, inCommon };
    const internalPatternRegexes = internalPatterns.map(toRegExp);

    const listeners: TSESLint.RuleListener = {
      ExportNamedDeclaration(node): void {
        handleExport(context, node, shape);
      },
      'ImportDeclaration[importKind="type"]'(
        node: TSESTree.ImportDeclaration
      ): void {
        handleTypeImport(context, node, internalPatternRegexes);
      }
    };

    return listeners;
  }
});
