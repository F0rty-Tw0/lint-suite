import assert from 'node:assert/strict';

import { afterEach, beforeEach, describe, it } from 'vitest';

import type { ReleaseScenario } from './test/common/release-scenario.type.ts';
import { createReleaseScenario } from './test/utils/release-scenario.spec.util.ts';

describe('FEATURE: affected package releases', (): void => {
  let scenario: ReleaseScenario;

  beforeEach((): void => {
    scenario = createReleaseScenario();
  });

  afterEach((): void => scenario.dispose());

  describe('GIVEN new rules and an existing umbrella', (): void => {
    it('WHEN previewing a release THEN versions and Git refs remain unchanged', (): void => {
      const head = scenario.git('rev-parse', 'HEAD');
      const tags = scenario.git('tag');

      const result = scenario.run('plan', 'minor');

      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(scenario.git('rev-parse', 'HEAD'), head);
      assert.equal(scenario.git('tag'), tags);
      assert.equal(scenario.git('status', '--porcelain'), '');
      assert.equal(scenario.version('rule-a'), '1.0.0');
      assert.equal(scenario.version('lint-suite'), '2.1.0');
    });

    it('WHEN preparing the first release THEN new rules retain initial versions and the umbrella bumps once', (): void => {
      const result = scenario.run('prepare', 'minor');
      const tags = scenario.git('tag', '--points-at', 'HEAD');

      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(scenario.version('rule-a'), '1.0.0');
      assert.equal(scenario.version('rule-b'), '1.0.0');
      assert.equal(scenario.version('lint-suite'), '2.2.0');
      assert.match(tags, /rule-a@1\.0\.0/);
      assert.match(tags, /rule-b@1\.0\.0/);
      assert.match(tags, /lint-suite@2\.2\.0/);
      assert.equal(scenario.git('status', '--porcelain'), '');
    });
  });

  describe('GIVEN a completed release', (): void => {
    beforeEach((): void => {
      scenario.git('tag', 'rule-a@1.0.0');
      scenario.git('tag', 'rule-b@1.0.0');
      scenario.git('tag', 'lint-suite@2.1.0');
      scenario.complete();
    });

    it('WHEN one rule changes THEN its dependent releases but its sibling does not', (): void => {
      scenario.change('packages/rule-a/src/index.ts');

      const result = scenario.run('prepare', 'minor');

      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(scenario.version('rule-a'), '1.1.0');
      assert.equal(scenario.version('rule-b'), '1.0.0');
      assert.equal(scenario.version('lint-suite'), '2.2.0');
    });

    it('WHEN only the umbrella changes THEN rule dependencies retain their versions', (): void => {
      scenario.change('packages/lint-suite/src/index.ts');

      const result = scenario.run('prepare', 'patch');

      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(scenario.version('rule-a'), '1.0.0');
      assert.equal(scenario.version('rule-b'), '1.0.0');
      assert.equal(scenario.version('lint-suite'), '2.1.1');
    });

    it('WHEN a private helper changes THEN only its public consumers release', (): void => {
      scenario.change('shared/private-helper/src/index.ts');

      const result = scenario.run('prepare', 'patch');
      const tags = scenario.git('tag', '--points-at', 'HEAD');

      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(scenario.version('rule-a'), '1.0.1');
      assert.equal(scenario.version('rule-b'), '1.0.0');
      assert.equal(scenario.version('lint-suite'), '2.1.1');
      assert.doesNotMatch(tags, /private-helper/);
    });

    it('WHEN a shared build input changes THEN all public packages release', (): void => {
      scenario.change('tools/src/release.ts');

      const result = scenario.run('prepare', 'patch');

      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(scenario.version('rule-a'), '1.0.1');
      assert.equal(scenario.version('rule-b'), '1.0.1');
      assert.equal(scenario.version('lint-suite'), '2.1.1');
    });

    it('WHEN no package is affected THEN preparation is a no-op', (): void => {
      scenario.change('notes.txt');
      const head = scenario.git('rev-parse', 'HEAD');
      const tags = scenario.git('tag');

      const result = scenario.run('prepare', 'patch');

      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.match(result.stdout, /Affected: none/);
      assert.equal(scenario.git('rev-parse', 'HEAD'), head);
      assert.equal(scenario.git('tag'), tags);
    });

    it('WHEN the previous publication is unfinished THEN a new bump is refused and retry selects its tagged packages', (): void => {
      scenario.change('packages/rule-a/src/index.ts');
      scenario.git('tag', '--force', 'rule-a@1.0.0');
      scenario.git('tag', '--force', 'lint-suite@2.1.0');
      scenario.git('tag', '--force', 'release/current');
      const head = scenario.git('rev-parse', 'HEAD');

      const preparation = scenario.run('prepare', 'patch');
      const retry = scenario.run('projects');

      assert.notEqual(preparation.status, 0);
      assert.match(preparation.stderr, /unfinished release/);
      assert.equal(retry.status, 0, retry.stderr);
      assert.equal(retry.stdout.trim(), 'lint-suite,rule-a');
      assert.equal(scenario.git('rev-parse', 'HEAD'), head);
      assert.equal(scenario.version('rule-a'), '1.0.0');
    });
  });
});
