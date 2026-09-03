// Wallaby auto-detects vitest; only exclude the rule fixtures, which are lint
// inputs (Angular decorators, `.spec.ts` names) rather than runnable tests.
const withoutFixtures = (patterns) => [...patterns, '!**/fixtures/**'];

module.exports = () => ({
  autoDetect: true,
  files: { override: withoutFixtures },
  tests: { override: withoutFixtures }
});
