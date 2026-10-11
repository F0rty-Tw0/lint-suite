import { join } from 'node:path';

import type {
  ConfigError,
  Constraint,
  RuleOptions,
  ShapeReader,
  WorkspaceModel
} from '../common/modular-boundaries.type.ts';

import {
  optionalRecord,
  optionalTags,
  tagConstraint
} from './config-shape.util.ts';
import { isRecord } from './guards.util.ts';

type TurboRules = {
  readonly key: 'dependencies' | 'dependents';
  readonly side: Constraint['side'];
};

type TagEntry = [string, unknown];

const TURBO_RULES: TurboRules[] = [
  { key: 'dependencies', side: 'source' },
  { key: 'dependents', side: 'target' }
];

const turboRuleConstraints = (
  reader: ShapeReader,
  tag: string,
  entry: Record<string, unknown>,
  rules: TurboRules
): Constraint[] => {
  const path = `boundaries.tags.${tag}.${rules.key}`;
  const lists = optionalRecord(reader, entry[rules.key], path);

  if (!lists) return [];

  const constraints: Constraint[] = [];
  const allow = optionalTags(reader, lists['allow'], `${path}.allow`);
  const deny = optionalTags(reader, lists['deny'], `${path}.deny`);

  if (allow) {
    const allowed = tagConstraint(rules.side, tag, 'turbo.json');

    allowed.onlyTags = allow;
    constraints.push(allowed);
  }

  if (deny) {
    const denied = tagConstraint(rules.side, tag, 'turbo.json');

    denied.notTags = deny;
    constraints.push(denied);
  }

  return constraints;
};

/** Spec § load-constraints: root `turbo.json` `boundaries.tags`, in key order. */
export const turboConstraints = (
  data: unknown,
  file: string,
  errors: ConfigError[]
): Constraint[] => {
  const reader: ShapeReader = { file, errors };
  const turbo = isRecord(data) ? data : undefined;
  const boundariesValue = turbo?.['boundaries'];
  const boundaries = optionalRecord(reader, boundariesValue, 'boundaries');
  const tags = optionalRecord(reader, boundaries?.['tags'], 'boundaries.tags');

  if (!tags) return [];

  const tagConstraints = ([tag, value]: TagEntry): Constraint[] => {
    const entry = optionalRecord(reader, value, `boundaries.tags.${tag}`);

    if (!entry) return [];

    const forRules = (rules: TurboRules): Constraint[] => {
      return turboRuleConstraints(reader, tag, entry, rules);
    };

    return TURBO_RULES.flatMap(forRules);
  };

  return Object.entries(tags).flatMap(tagConstraints);
};

/** Spec § load-constraints: `.moon/workspace.yml` `constraints.tagRelationships`, in key order. */
export const moonConstraints = (
  data: unknown,
  file: string,
  errors: ConfigError[]
): Constraint[] => {
  const reader: ShapeReader = { file, errors };
  const workspace = isRecord(data) ? data : undefined;
  const sectionValue = workspace?.['constraints'];
  const section = optionalRecord(reader, sectionValue, 'constraints');
  const path = 'constraints.tagRelationships';
  const relationshipsValue = section?.['tagRelationships'];
  const relationships = optionalRecord(reader, relationshipsValue, path);

  if (!relationships) return [];

  const relationshipConstraints = ([tag, value]: TagEntry): Constraint[] => {
    const onlyTags = optionalTags(reader, value, `${path}.${tag}`);

    // Like moon: an empty list allows everything, and a dependency carrying the source tag itself is allowed.
    if (!onlyTags || onlyTags.length === 0) return [];

    const constraint = tagConstraint('source', tag, '.moon/workspace.yml');

    constraint.onlyTags = [...onlyTags, tag];

    return [constraint];
  };

  return Object.entries(relationships).flatMap(relationshipConstraints);
};

/** Root `turbo.json`, then `.moon/workspace.yml`; each source is on unless set to `false`. */
export const configConstraints = (
  model: WorkspaceModel,
  options: RuleOptions,
  errors: ConfigError[]
): Constraint[] => {
  const sources = options.configSources ?? {};
  const constraints: Constraint[] = [];

  if (sources.turbo !== false) {
    const turboFile = join(model.root, 'turbo.json');
    const turbo = turboConstraints(model.rootTurbo, turboFile, errors);

    constraints.push(...turbo);
  }

  if (sources.moon !== false) {
    const moonFile = join(model.root, '.moon', 'workspace.yml');
    const moon = moonConstraints(model.moonWorkspace, moonFile, errors);

    constraints.push(...moon);
  }

  return constraints;
};
