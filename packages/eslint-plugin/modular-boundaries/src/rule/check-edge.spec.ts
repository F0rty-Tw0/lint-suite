import assert from 'node:assert/strict';

import { test } from 'vitest';

import type {
  ConstraintSet,
  EdgeReport,
  Project,
  RuleOptions,
  Target
} from './common/modular-boundaries.type.ts';

import { checkEdge } from './check-edge.ts';
import {
  constraintSetStub,
  constraintStub,
  projectStub,
  sourceConstraintSetStub
} from './test/utils/check-edge.spec.util.ts';

type EdgeOverrides = {
  source?: Project;
  target: Target;
  specifier?: string;
  constraints?: ConstraintSet;
  options?: RuleOptions;
  reachesSource?: () => boolean;
  cyclePath?: () => string[];
};

const app = projectStub('app', { tags: ['type:app'] });
const lib = projectStub('lib', { tags: ['type:ui'] });
const bare = projectStub('bare');
const noConstraints = constraintSetStub({ constraints: [] });
const untaggedApp = constraintSetStub({ constraints: [constraintStub()] });

const check = (overrides: EdgeOverrides): EdgeReport | undefined => {
  const { target } = overrides;
  const specifier = target.kind === 'npm' ? target.specifier : 'x';
  const input = {
    source: app,
    specifier,
    constraints: noConstraints,
    options: {},
    ...overrides
  };

  return checkEdge(input);
};

const viaPackage = (project: Project): Target => {
  const target: Target = { kind: 'project', project, via: 'package' };

  return target;
};

const npm = (name: string, specifier = name): Target => {
  const target: Target = { kind: 'npm', name, specifier };

  return target;
};

test('cross-project relative import reports and stops', (): void => {
  const target: Target = { kind: 'project', project: lib, via: 'relative' };
  const report = check({ target, constraints: untaggedApp });
  const expected: EdgeReport = {
    messageId: 'noRelativeOrAbsoluteImportsAcrossLibraries',
    data: { source: 'app', target: 'lib' }
  };

  assert.deepEqual(report, expected);
});

test('package-name import of own project reports noSelfCircularDependencies', (): void => {
  const alias: Target = { kind: 'project', project: app, via: 'alias' };
  const report = check({ target: viaPackage(app), specifier: '@ws/app/x' });
  const expected: EdgeReport = {
    messageId: 'noSelfCircularDependencies',
    data: { source: 'app', specifier: '@ws/app/x' }
  };

  assert.deepEqual(report, expected);
  assert.equal(check({ target: alias })?.messageId, expected.messageId);
});

test('relative import inside own project reports nothing', (): void => {
  const target: Target = { kind: 'project', project: app, via: 'relative' };
  const reachesSource = (): boolean => true;
  const report = check({ target, constraints: untaggedApp, reachesSource });

  assert.equal(report, undefined);
  assert.equal(check({ target: { kind: 'skip' } }), undefined);
});

test('banned external matches the full specifier', (): void => {
  const source = projectStub('app', { declaredDependencies: ['lodash'] });
  const constraints = sourceConstraintSetStub(
    { bannedExternal: ['@nestjs/*'] },
    source
  );
  const target = npm('@nestjs/common', '@nestjs/common/testing');
  const expected: EdgeReport = {
    messageId: 'bannedExternalImportsViolation',
    data: {
      specifier: '@nestjs/common/testing',
      source: 'app',
      origin: 'eslint'
    }
  };

  assert.deepEqual(check({ source, target, constraints }), expected);
  assert.equal(
    check({ source, target: npm('lodash'), constraints }),
    undefined
  );
});

test('banned external matches the specifier, not the package name', (): void => {
  const source = projectStub('app', { declaredDependencies: ['lodash'] });
  const constraints = sourceConstraintSetStub(
    { bannedExternal: ['lodash/fp'] },
    source
  );
  const subpath = check({ source, target: npm('lodash', 'lodash/fp'), constraints });
  const root = check({ source, target: npm('lodash'), constraints });

  assert.equal(subpath?.messageId, 'bannedExternalImportsViolation');
  assert.equal(root, undefined);
});

test('allowedExternal [] bans every npm import', (): void => {
  const constraints = sourceConstraintSetStub({ allowedExternal: [] }, app);
  const report = check({ target: npm('lodash'), constraints });

  assert.equal(report?.messageId, 'bannedExternalImportsViolation');
});

test('undeclared npm dependency reports; @types/x satisfies x', (): void => {
  const typed = projectStub('app', { declaredDependencies: ['@types/lodash'] });
  const options = { checkUndeclaredDependencies: false };
  const expected: EdgeReport = {
    messageId: 'undeclaredDependency',
    data: { name: 'lodash', source: 'app' }
  };

  assert.deepEqual(check({ target: npm('lodash', 'lodash/fp') }), expected);
  assert.equal(check({ source: typed, target: npm('lodash') }), undefined);
  assert.equal(check({ target: npm('lodash'), options }), undefined);
});

test('npm target that passes steps 3 and 4 stops checking', (): void => {
  const source = projectStub('app', { declaredDependencies: ['lodash'] });
  const report = check({
    source,
    target: npm('lodash'),
    constraints: untaggedApp
  });

  assert.equal(report, undefined);
});

test('project via package name is undeclared only when the source has its own package.json', (): void => {
  const owned = projectStub('app', { hasOwnPackageJson: true });
  const declared = projectStub('app', {
    hasOwnPackageJson: true,
    declaredDependencies: ['@ws/lib']
  });
  const expected: EdgeReport = {
    messageId: 'undeclaredDependency',
    data: { name: '@ws/lib', source: 'app' }
  };

  assert.equal(check({ target: viaPackage(lib) }), undefined);
  assert.deepEqual(check({ source: owned, target: viaPackage(lib) }), expected);
  assert.equal(check({ source: declared, target: viaPackage(lib) }), undefined);
});

test('circular reports the joined cycle path when reachesSource returns true', (): void => {
  const target = viaPackage(lib);
  const cyclePath = (): string[] => ['app', 'lib', 'bare', 'app'];
  const report = check({ target, reachesSource: () => true, cyclePath });
  const expected: EdgeReport = {
    messageId: 'noCircularDependencies',
    data: { source: 'app', target: 'lib', path: 'app -> lib -> bare -> app' }
  };

  assert.deepEqual(report, expected);
  assert.equal(check({ target, reachesSource: () => false }), undefined);
});

test('checkCircularDependencies false skips the circular check', (): void => {
  const options = { checkCircularDependencies: false };
  const target = viaPackage(lib);

  assert.equal(
    check({ target, options, reachesSource: () => true }),
    undefined
  );
});

test('untagged: only ESLint-origin constraints count', (): void => {
  const turbo = constraintStub({ origin: 'turbo.json' });
  const turboOnly = constraintSetStub({ constraints: [turbo] });
  const matched = sourceConstraintSetStub({}, app);
  const target = viaPackage(lib);
  const expected: EdgeReport = {
    messageId: 'projectWithoutTagsCannotHaveDependencies',
    data: { source: 'app', target: 'lib' }
  };

  assert.deepEqual(check({ target, constraints: untaggedApp }), expected);
  assert.equal(check({ target, constraints: turboOnly }), undefined);
  assert.equal(check({ target, constraints: matched }), undefined);
});

test('onlyTags failure reports onlyTagsConstraintViolation', (): void => {
  const onlyTags = ['type:util', 'type:feature'];
  const constraints = sourceConstraintSetStub({ onlyTags }, app);
  const expected: EdgeReport = {
    messageId: 'onlyTagsConstraintViolation',
    data: {
      source: 'app',
      target: 'bare',
      side: 'target',
      project: 'bare',
      tags: "'type:util', 'type:feature'",
      origin: 'eslint'
    }
  };

  assert.deepEqual(check({ target: viaPackage(bare), constraints }), expected);
});

test('an edge failing two checks gets the earlier one', (): void => {
  const bans = sourceConstraintSetStub({ bannedExternal: ['lodash'] }, app);
  const banned = check({ target: npm('lodash'), constraints: bans });
  const circular = check({
    target: viaPackage(lib),
    constraints: untaggedApp,
    reachesSource: () => true
  });

  assert.equal(banned?.messageId, 'bannedExternalImportsViolation');
  assert.equal(circular?.messageId, 'noCircularDependencies');
});
