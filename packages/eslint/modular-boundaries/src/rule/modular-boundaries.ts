import { isAbsolute, relative, sep } from 'node:path';

import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { checkEdge } from './check-edge.ts';
import { defaultOptions, meta } from './common/modular-boundaries.const.ts';
import type {
  ConfigError,
  EdgeVisitor,
  MessageIds,
  Options,
  Project,
  RuleContext,
  RuleOptions,
  Target,
  WorkspaceModel
} from './common/modular-boundaries.type.ts';
import { importEdgeListeners } from './import-edges.ts';
import { constraintsFor } from './load-constraints.ts';
import { reachesSource, shortestProjectPath } from './project-graph.ts';
import { toPosixPath } from './utils/posix-path.util.ts';
import { resolveTarget } from './utils/resolve-target.util.ts';
import { projectForFile, workspaceModelFor } from './workspace-model.ts';

type CycleCheck = {
  readonly reachesSource?: () => boolean;
  readonly cyclePath?: () => string[];
};

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint/modular-boundaries#readme'
);

const FIRST_LINE: TSESTree.Position = { line: 1, column: 0 };

const reportConfigError = (
  context: RuleContext,
  root: string,
  error: ConfigError
): void => {
  const path = relative(root, error.file);
  const file = toPosixPath(path);
  const data = { file, message: error.message };

  context.report({ loc: FIRST_LINE, messageId: 'workspaceConfigError', data });
};

const isInside = (root: string, path: string): boolean => {
  const fromRoot = relative(root, path);
  const isParent = fromRoot === '..' || fromRoot.startsWith(`..${sep}`);

  return !isParent && !isAbsolute(fromRoot);
};

/** README § Checks, step 5: thunks so the project graph is built only when checkEdge reaches the cycle step. */
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

    const { allow } = constraints;
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
