import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  bannedExternalReport,
  typesPackageName,
  undeclaredDependencyReport
} from './external-imports.util.ts';
import { compiledPatterns } from './tag-patterns.util.ts';
import {
  constraintStub,
  projectStub
} from '../test/utils/check-edge.spec.util.ts';

const app = projectStub('app');

test('typesPackageName maps plain and scoped names', (): void => {
  assert.equal(typesPackageName('lodash'), '@types/lodash');
  assert.equal(typesPackageName('@scope/pkg'), '@types/scope__pkg');
});

test('scoped @types/scope__name satisfies @scope/name', (): void => {
  const typed = projectStub('app', {
    declaredDependencies: ['@types/scope__pkg']
  });

  assert.equal(undeclaredDependencyReport(typed, '@scope/pkg'), undefined);
  assert.ok(undeclaredDependencyReport(typed, 'lodash'));
});

test('allowedExternal bans npm imports it does not match', (): void => {
  const matched = [constraintStub({ allowedExternal: ['lodash*'] })];
  const patterns = compiledPatterns(matched);
  const rejected = bannedExternalReport(matched, app, 'rxjs', patterns);
  const kept = bannedExternalReport(matched, app, 'lodash-es', patterns);

  assert.equal(kept, undefined);
  assert.equal(rejected?.messageId, 'bannedExternalImportsViolation');
});

test('the first banning constraint names the origin', (): void => {
  const matched = [
    constraintStub({ bannedExternal: ['rxjs'], origin: '.moon/workspace.yml' }),
    constraintStub({ allowedExternal: [] })
  ];
  const patterns = compiledPatterns(matched);
  const report = bannedExternalReport(matched, app, 'rxjs', patterns);

  assert.equal(report?.data['origin'], '.moon/workspace.yml');
});
