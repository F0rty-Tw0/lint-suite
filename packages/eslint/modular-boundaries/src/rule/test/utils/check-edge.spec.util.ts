import type {
  Constraint,
  ConstraintSet,
  Project
} from '../../common/modular-boundaries.type.ts';

type ConstraintSetSpec = {
  constraints: Constraint[];
  sourceMatches?: [Project, Constraint[]][];
  targetMatches?: [Project, Constraint[]][];
  eslintSourceMatched?: Project[];
};

export const projectStub = (
  id: string,
  overrides: Partial<Project> = {}
): Project => {
  const project: Project = {
    id,
    root: `/ws/${id}`,
    packageName: `@ws/${id}`,
    tags: [],
    declaredDependencies: [],
    hasOwnPackageJson: false,
    ...overrides
  };

  return project;
};

export const constraintStub = (
  overrides: Partial<Constraint> = {}
): Constraint => {
  const constraint: Constraint = {
    side: 'source',
    match: {},
    matchesPackageName: false,
    origin: 'eslint',
    ...overrides
  };

  return constraint;
};

export const constraintSetStub = (spec: ConstraintSetSpec): ConstraintSet => {
  const hasEslintConstraints = spec.constraints.some(
    (constraint) => constraint.origin === 'eslint'
  );
  const sourceMatches = new Map(spec.sourceMatches);
  const targetMatches = new Map(spec.targetMatches);
  const eslintSourceMatched = new Set(spec.eslintSourceMatched);
  const constraintSet: ConstraintSet = {
    constraints: spec.constraints,
    sourceMatches,
    targetMatches,
    eslintSourceMatched,
    hasEslintConstraints,
    errors: []
  };

  return constraintSet;
};

/** One source-side constraint matched by `source`, which also counts as ESLint-matched. */
export const sourceConstraintSetStub = (
  overrides: Partial<Constraint>,
  source: Project
): ConstraintSet => {
  const constraint = constraintStub(overrides);
  const sourceMatches: [Project, Constraint[]][] = [[source, [constraint]]];
  const constraintSet = constraintSetStub({
    constraints: [constraint],
    sourceMatches,
    eslintSourceMatched: [source]
  });

  return constraintSet;
};
