# @lint-suite/oxlint-config

Oxlint configuration presets mirroring the `lint-suite` ESLint presets. Rules oxlint can't run are listed in [MISSING.md](./MISSING.md).

## Install

```sh
pnpm add -D @lint-suite/oxlint-config oxlint
```

Peers: `oxlint >=1.88.0`, `typescript`, and `eslint`. `eslint` is required even if you only run oxlint: the JS plugins load `@typescript-eslint/utils`, which imports it at runtime. `oxlint-tsgolint` is optional (see below).

## Use `defineLintSuiteConfig`

Create `oxlint.config.ts`:

```ts
import {
  defineLintSuiteConfig,
  recommended,
  angular,
  vitest
} from '@lint-suite/oxlint-config';

export default defineLintSuiteConfig(recommended, angular, vitest, {
  rules: { 'eslint/no-console': 'warn' }
});
```

Always compose with `defineLintSuiteConfig`. Oxlint ignores `settings`, `globals`, `env` and `ignorePatterns` at the top level of an extended config. A plain `{ extends: [recommended] }` silently loses them, and `boundaries` then reports nothing. The helper hoists them to the root, later configs win, and your own config goes last.

`.oxlintrc.json` is not supported: its `extends` only takes file paths.

## Exports are layers of `recommended`

`recommended` is `base`, `javascript`, `typescript` and `boundaries` together. Each export is one layer of it, not a standalone preset.

- `typescript` alone lacks the shared core rules (`for-direction`, `no-cond-assign` and the rest of the ESLint recommended set). They live in `javascript`.
- `javascript` alone applies those shared core rules to TypeScript files too, not only to JavaScript files.

Add the layers you need next to each other, or start from `recommended`.

| Export                  | Contents                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| `recommended`           | `base`, `javascript`, `typescript`, `boundaries`                  |
| `base`                  | Practices, limits and stylistic rules for JS and TS files         |
| `javascript`            | ESLint core rules                                                 |
| `typescript`            | Type-free TypeScript rules, import rules, `local` plugin rules    |
| `boundaries`            | `boundaries` and `modular-boundaries` rules with their settings   |
| `typescriptTypeAware`   | The 27 type-aware `typescript/*` rules. Add next to `recommended` |
| `angular`               | Angular rules (opt-in)                                            |
| `rxjs`                  | The 5 type-free rxjs rules (opt-in)                               |
| `vitest`                | Vitest rules (opt-in)                                             |
| `playwright`            | Playwright rules (opt-in)                                         |
| `storybook`             | Storybook rules (opt-in)                                          |
| `defineLintSuiteConfig` | Helper that composes the configs above                            |

Subpaths: `@lint-suite/oxlint-config/local-plugin` (the `local` JS plugin) and `@lint-suite/oxlint-config/eslint` (`oxlintOverlap`).

## Type-aware rules

`typescriptTypeAware` needs `oxlint-tsgolint` (optional peer). Its bundled engine is a native typescript-go build that targets TypeScript 7, so you don't install TypeScript 7 yourself. It ran here once, by hand, on this repo (TypeScript 6) and reported `typescript(no-unsafe-call)` and `typescript(require-await)`. CI does not run it, and rule options are only checked as config. `prefer-optional-chain` and `no-unnecessary-condition` are in oxlint's `nursery` category and may not run or may change.

## Turn off overlap in ESLint: `oxlintOverlap`

If you run ESLint next to oxlint, append `oxlintOverlap(config)` to your ESLint flat config. It turns off, in ESLint, every rule that the oxlint config enables, JS-plugin rules included, but only for the files oxlint lints with that rule:

```ts
import { recommended } from 'lint-suite/eslint';
import { oxlintOverlap } from '@lint-suite/oxlint-config/eslint';
import oxlintConfig from './oxlint.config.ts';

export default [...recommended, ...oxlintOverlap(oxlintConfig)];
```

How the blocks are scoped:

- Top-level rules are turned off only for the file types oxlint lints (`.js`, `.jsx`, `.cjs`, `.mjs`, `.ts`, `.tsx`, `.cts`, `.mts`). ESLint keeps them on for `.html`, `.json` and the rest.
- Rules enabled by an override are turned off only for files that match both that override's `files` and an oxlint file type. A glob that can match other files, such as `scripts/**`, is paired with each oxlint extension glob as an ESLint nested `files` entry (`[['scripts/**', '**/*.ts'], …]`), so ESLint keeps the rule on for `scripts/a.html` and `scripts/a.json`.
- If a later override turns a rule off for some paths, the ESLint block gets those paths as `ignores`, so ESLint still lints them.
- Rule keys are read as oxlint reads them: `@typescript-eslint/x`, `import-x/x`, `react-hooks/x` and the other aliases oxlint accepts count as the rule they stand for, and `typescript/default-param-last` turns off `eslint/default-param-last`.
- A built-in rule counts only when oxlint runs its plugin: `eslint` always, plus every `plugins` list in your config and its `extends` (a config without `plugins` means `unicorn`, `typescript`, `oxc`). An override's own `plugins` count only for that override's rules and files, as in oxlint. Exception: when `import` is enabled only inside an override, oxlint builds no module graph, so `import/default`, `export`, `named`, `namespace`, `no-cycle`, `no-named-as-default`, `no-named-as-default-member` and `no-self-import` do not run there, and ESLint keeps them on.
- Files matched by the root `ignorePatterns` are ignored by every block, so ESLint keeps every rule on for them.
- oxlint never lints minified files, even when you pass them by path: any file whose name contains `.min.`, `-min.` or `_min.`, such as `vendor/lib.min.js` or `src/a-min.ts`. Every block ignores them, so ESLint keeps every rule on for them.

Limits:

- oxlint also skips files in `.gitignore`; `oxlintOverlap` does not read it. If ESLint should skip them too, add `includeIgnoreFile` from `@eslint/compat` to your ESLint config.
- oxlint also skips the paths listed in `.eslintignore` (it reads that file by default); `oxlintOverlap` does not read it either. ESLint flat config ignores `.eslintignore`, so the rules turned off there run in neither tool. Add those paths to your ESLint `ignores` too, or remove them from `.eslintignore`.
- Rule options set in the ESLint config are not carried over. `oxlintOverlap` turns the ESLint rule off, so an option override, such as `maxLineLength` for `local/one-line-guard`, must be repeated in the oxlint config. Otherwise oxlint runs the rule with the preset's options.
- oxlint lints the `<script>` blocks of `.vue`, `.svelte` and `.astro` files, but `oxlintOverlap` leaves those files to ESLint with every rule on.
- A bare glob (no `/`) in an oxlint override is emitted as `**/<pattern>`, because oxlint matches it at any depth and ESLint only at the top level.
- `excludeFiles` is not supported and throws.
- `oxlintOverlap` reads the oxlint config's `ignorePatterns` and override `files` globs as relative to the same base directory as the ESLint config, so keep `.oxlintrc.json` / `oxlint.config.ts` next to `eslint.config.*`.
- A bare rule name such as `'no-null'` is not supported and throws, naming the key and where it is (`rules`, `overrides[0].rules`, `extends[1].rules`, …): oxlint picks its plugin from an internal registry. Write it with its prefix, e.g. `'unicorn/no-null'`.

## Missing rules

See [MISSING.md](./MISSING.md) for every ESLint rule that is not ported, and why.
