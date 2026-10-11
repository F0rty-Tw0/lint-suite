import { isAbsolute, relative, sep } from 'node:path';

import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { checkEdge } from './check-edge.ts';
import { defaultOptions, meta } from './common/modular-boundaries.const.ts';
import type {
  ConfigError,
  MessageIds,
  Options,
  Project,
  RuleContext,
  RuleOptions,
  Target,
  WorkspaceModel
} from './common/modular-boundaries.type.ts';
import { constraintsFor } from './load-constraints.ts';
import { reachesSource, shortestProjectPath } from './project-graph.ts';
import { resolveTarget } from './utils/resolve-target.util.ts';
import { projectForFile, workspaceModelFor } from './workspace-model.ts';

type EdgeVisitor = (node: TSESTree.Node, specifier: string) => void;

type CycleCheck = {
  readonly reachesSource?: () => boolean;
  readonly cyclePath?: () => string[];
};

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint-plugin/modular-boundaries#readme'
);

const FIRST_LINE: TSESTree.Position = { line: 1, column: 0 };

/** A string literal, or a template literal without expressions. */
const specifierOf = (node: TSESTree.Node): string | undefined => {
  if (node.type === AST_NODE_TYPES.Literal) {
    const { value } = node;

    return typeof value === 'string' ? value : undefined;
  }

  if (node.type !== AST_NODE_TYPES.TemplateLiteral) return undefined;
  if (node.expressions.length > 0) return undefined;

  return node.quasis[0]?.value.cooked ?? undefined;
};

/** Spec § resolve-target: the AST nodes whose specifier is one import edge. */
const importEdgeListeners = (visit: EdgeVisitor): TSESLint.RuleListener => {
  const visitSource = (node: TSESTree.Node | null): void => {
    if (node === null) return;

    const specifier = specifierOf(node);

    if (specifier !== undefined) visit(node, specifier);
  };
  const visitRequire = (node: TSESTree.CallExpression): void => {
    const { callee } = node;
    const [first] = node.arguments;
    const isRequire =
      callee.type === AST_NODE_TYPES.Identifier && callee.name === 'require';

    if (isRequire && first !== undefined) visitSource(first);
  };
  const visitImportEquals = (
    node: TSESTree.TSImportEqualsDeclaration
  ): void => {
    const reference = node.moduleReference;
    const isExternal =
      reference.type === AST_NODE_TYPES.TSExternalModuleReference;

    if (isExternal) visitSource(reference.expression);
  };
  const listeners: TSESLint.RuleListener = {
    ImportDeclaration: (node): void => visitSource(node.source),
    ExportNamedDeclaration: (node): void => visitSource(node.source),
    ExportAllDeclaration: (node): void => visitSource(node.source),
    ImportExpression: (node): void => visitSource(node.source),
    CallExpression: visitRequire,
    TSImportEqualsDeclaration: visitImportEquals,
    TSImportType: (node): void => visitSource(node.source)
  };

  return listeners;
};

const reportConfigError = (
  context: RuleContext,
  root: string,
  error: ConfigError
): void => {
  const file = relative(root, error.file).split(sep).join('/');
  const data = { file, message: error.message };

  context.report({ loc: FIRST_LINE, messageId: 'workspaceConfigError', data });
};

const isInside = (root: string, path: string): boolean => {
  const fromRoot = relative(root, path);
  const isParent = fromRoot === '..' || fromRoot.startsWith(`..${sep}`);

  return !isParent && !isAbsolute(fromRoot);
};

/** Spec § checks step 5: thunks so the project graph is built only when checkEdge reaches the cycle step. */
const cycleCheckFor = (
  model: WorkspaceModel,
  options: RuleOptions,
  source: Project,
  target: Target
): CycleCheck => {
  const noCycleCheck: CycleCheck = {};
  const isEnabled = options.checkCircularDependencies !== false;

  if (!isEnabled || target.kind !== 'project') return noCycleCheck;
  if (target.project === source) return noCycleCheck;

  const ignored = options.ignoredCircularDependencies ?? [];
  const cycleCheck: CycleCheck = {
    reachesSource: (): boolean =>
      reachesSource(model, ignored, target.project, source),
    cyclePath: (): string[] => {
      const path = shortestProjectPath(model, ignored, target.project, source);

      return [source.id, ...path];
    }
  };

  return cycleCheck;
};

export default createRule<Options, MessageIds>({
  name: 'modular-boundaries',
  meta,
  defaultOptions,
  create(context, [options]): TSESLint.RuleListener {
    const noListeners: TSESLint.RuleListener = {};
    const { filename } = context;
    const isFile = isAbsolute(filename);

    if (!isFile) return noListeners;

    const model = workspaceModelFor(filename, options.workspaceRoot);

    if (model === undefined) return noListeners;

    const isInRoot = isInside(model.root, filename);

    if (!isInRoot) return noListeners;

    const constraints = constraintsFor(model, options);
    const configErrors = [...model.errors, ...constraints.errors];
    const reportConfigErrors = (): void => {
      for (const error of configErrors) {
        reportConfigError(context, model.root, error);
      }
    };
    const configListeners: TSESLint.RuleListener = {
      Program: reportConfigErrors
    };
    const source = projectForFile(model, filename);

    if (source === undefined) return configListeners;

    const allow = options.allow ?? [];
    const checkSpecifier: EdgeVisitor = (node, specifier) => {
      const target = resolveTarget(specifier, filename, model, allow);
      const cycleCheck = cycleCheckFor(model, options, source, target);
      const edge = {
        source,
        target,
        specifier,
        constraints,
        options,
        ...cycleCheck
      };
      const report = checkEdge(edge);

      if (report === undefined) return;

      context.report({ node, messageId: report.messageId, data: report.data });
    };
    const edgeListeners = importEdgeListeners(checkSpecifier);
    const listeners: TSESLint.RuleListener = {
      ...configListeners,
      ...edgeListeners
    };

    return listeners;
  }
});
