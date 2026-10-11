import type {
  ConstraintSet,
  EdgeReport,
  Project,
  RuleOptions,
  Target
} from './common/modular-boundaries.type.ts';

import { findConstraintViolation } from './utils/edge-constraints.util.ts';
import {
  bannedExternalReport,
  undeclaredDependencyReport
} from './utils/external-imports.util.ts';

type CheckEdgeInput = {
  source: Project;
  target: Target;
  specifier: string;
  constraints: ConstraintSet;
  options: RuleOptions;
  reachesSource?: () => boolean;
  cyclePath?: () => string[];
};

type NpmTarget = Extract<Target, { kind: 'npm' }>;

type ProjectTarget = Extract<Target, { kind: 'project' }>;

const undeclaredReport = (
  input: CheckEdgeInput,
  name: string
): EdgeReport | undefined => {
  if (input.options.checkUndeclaredDependencies === false) return undefined;

  return undeclaredDependencyReport(input.source, name);
};

const checkNpmEdge = (
  input: CheckEdgeInput,
  target: NpmTarget
): EdgeReport | undefined => {
  const { source, constraints, specifier } = input;
  const matched = constraints.sourceMatches.get(source) ?? [];
  const banned = bannedExternalReport(matched, source, specifier);

  if (banned) return banned;

  return undeclaredReport(input, target.name);
};

const circularReport = (
  input: CheckEdgeInput,
  target: Project
): EdgeReport | undefined => {
  const { source, options, reachesSource, cyclePath } = input;
  const isEnabled = options.checkCircularDependencies !== false;
  const reaches = isEnabled && reachesSource !== undefined && reachesSource();

  if (!reaches) return undefined;

  const ids = cyclePath?.() ?? [source.id, target.id, source.id];
  const data = { source: source.id, target: target.id, path: ids.join(' -> ') };
  const report: EdgeReport = { messageId: 'noCircularDependencies', data };

  return report;
};

const packageImportReport = (
  input: CheckEdgeInput,
  target: ProjectTarget
): EdgeReport | undefined => {
  const { packageName } = target.project;
  const isPackageImport =
    target.via === 'package' && input.source.hasOwnPackageJson;

  if (!isPackageImport || packageName === undefined) return undefined;

  return undeclaredReport(input, packageName);
};

const crossProjectReport = (
  input: CheckEdgeInput,
  target: ProjectTarget
): EdgeReport | undefined => {
  const { source, constraints } = input;
  const project = target.project;
  const undeclared = packageImportReport(input, target);

  if (undeclared) return undeclared;

  const circular = circularReport(input, project);

  if (circular) return circular;

  const isUntagged =
    constraints.hasEslintConstraints &&
    !constraints.eslintSourceMatched.has(source);
  const edge = { source, target: project };

  if (!isUntagged) return findConstraintViolation(constraints, edge);

  const data = { source: source.id, target: project.id };
  const report: EdgeReport = {
    messageId: 'projectWithoutTagsCannotHaveDependencies',
    data
  };

  return report;
};

const checkProjectEdge = (
  input: CheckEdgeInput,
  target: ProjectTarget
): EdgeReport | undefined => {
  const { source, specifier } = input;
  const isRelative = target.via === 'relative';
  const isSelf = target.project === source;

  if (isSelf && isRelative) return undefined;

  if (isSelf) {
    const data = { source: source.id, specifier };
    const report: EdgeReport = {
      messageId: 'noSelfCircularDependencies',
      data
    };

    return report;
  }

  if (!isRelative) return crossProjectReport(input, target);

  const data = { source: source.id, target: target.project.id };
  const report: EdgeReport = {
    messageId: 'noRelativeOrAbsoluteImportsAcrossLibraries',
    data
  };

  return report;
};

/** Spec § checks steps 1–7: at most one report per edge, earliest step wins. */
export const checkEdge = (input: CheckEdgeInput): EdgeReport | undefined => {
  const { target } = input;

  if (target.kind === 'skip') return undefined;
  if (target.kind === 'npm') return checkNpmEdge(input, target);

  return checkProjectEdge(input, target);
};
