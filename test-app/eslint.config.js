import {
  base,
  typescript,
  angular,
  angularTemplate,
  rxjs,
  json,
  storybook,
  vitest,
  playwright,
  prettier,
  boundaries,
} from 'lint-suite';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.storybook/**',
      'storybook-static/**',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
    ],
  },
  ...base,
  ...typescript,
  ...angular,
  ...angularTemplate,
  ...rxjs,
  ...json,
  ...storybook,
  ...vitest,
  ...playwright,
  ...prettier,
  ...boundaries,
];
