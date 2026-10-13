import type {
  ParserServicesWithTypeInformation,
  TSESLint,
  TSESTree
} from '@typescript-eslint/utils';

import type {
  FileEdges,
  MessageIds,
  RuleContext
} from './common/no-unused-exports.type.ts';
import { exportIndex, publicExportIndex } from './export-index.ts';
import { exportNodes } from './utils/export-nodes.util.ts';
import type { GlobMatcher } from '@lint-suite/rule-internals/common/glob-matcher.type.ts';

type ReportOptions = {
  readonly context: RuleContext;
  readonly isEntry: GlobMatcher;
  readonly node: TSESTree.Program;
  readonly services: ParserServicesWithTypeInformation;
};

type NameReportOptions = {
  readonly context: RuleContext;
  readonly edges: FileEdges;
  readonly node: TSESTree.Program;
  readonly publicNames: Set<string> | undefined;
  readonly used: Map<string, number> | undefined;
};

const reportModule = (context: RuleContext, node: TSESTree.Program): void => {
  const report: TSESLint.ReportDescriptor<MessageIds> = {
    node,
    messageId: 'unusedModule'
  };

  context.report(report);
};

const reportNames = ({
  context,
  edges,
  node,
  publicNames,
  used
}: NameReportOptions): void => {
  const nodes = exportNodes(node);
  const uniqueExports = new Set(edges.exports);

  for (const name of uniqueExports) {
    const count = used?.get(name) ?? 0;
    const isPublic = publicNames?.has(name) ?? false;

    if (count > 0 || isPublic) continue;

    const data = { name };
    const target = nodes.get(name) ?? node;
    const report: TSESLint.ReportDescriptor<MessageIds> = {
      node: target,
      messageId: 'unusedExport',
      data
    };

    context.report(report);
  }
};

export const reportUnusedExports = ({
  context,
  isEntry,
  node,
  services
}: ReportOptions): void => {
  const sourceFile = services.esTreeNodeToTSNodeMap.get(node);
  const aggregate = exportIndex(services.program);
  const edges = aggregate.byFile.get(sourceFile.fileName);

  if (!edges) return;

  if (edges.skipped) return;

  const hasStarExports = edges.starTargets.length > 0;
  const hasExports = edges.exports.length > 0 || hasStarExports;

  if (!hasExports) return;

  const isImported = aggregate.imported.has(edges.fileName);

  if (!isImported) {
    reportModule(context, node);

    return;
  }

  const used = aggregate.usage.get(edges.fileName);
  const publicIndex = publicExportIndex(aggregate, isEntry);
  const publicNames = publicIndex.get(edges.fileName);
  const nameOptions: NameReportOptions = {
    context,
    edges,
    node,
    publicNames,
    used
  };

  reportNames(nameOptions);
};
