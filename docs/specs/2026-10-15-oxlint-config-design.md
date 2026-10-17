# Oxlint config package — design

Date: 2026-10-15
Status: approved by user 2026-10-15 (critic OKAY in round 4)
Research: `C:\Users\artio\html-reports\lint-suite\2026-10-15-oxlint-adaptation-research.html`, `…-oxlint-html-json-limitations.html`

## Goal

Ship a new package that gives oxlint users the lint-suite rule set as far as oxlint can run it today. Everything that can't run lives in a published `MISSING.md` note. The ESLint presets in `lint-suite` stay as they are.

Success criteria:

1. `oxlint -c <config extending recommended>` lints this repo's `packages/eslint/*/src` without any `Error running JS plugin` diagnostic. This is a manual check: the implementer runs it once and pastes the command and summary output into the done report.
2. A parity spec proves, for each pass defined under Tests, that every rule the ESLint presets enable is either in the oxlint config (same severity, same options) or in `MISSING.md`, as that pass defines. It fails on drift in either direction.
3. For each oxlint config a user can compose from this package's exports, appending `oxlintOverlap(<that config>)` to the matching lint-suite ESLint config leaves no rule enabled in both tools.
4. The existing lint, typecheck and test baseline for the repo stays the same.

## Decisions (user)

- New package under `packages/oxlint/`, not a folder inside `lint-suite`.
- Hand-written oxlint configs, guarded by a parity spec (not generated). The parity spec also compares options.
- Type-aware rules (tsgolint, TS 7) ship as a separate opt-in export.
- ESLint companion: an append-on config that turns off what oxlint covers, including JS-plugin rules.
- Accept the loss of rules oxlint can't run; document them in a note inside the package.
- No changes to rule packages in this work (no fallback fixes).

## Package

- Folder `packages/oxlint/config`, npm name `@lint-suite/oxlint-config`, nx name `oxlint-config`, version `1.0.0`. The name follows `@lint-suite/<tool>-<slug>`.
- Add `packages/oxlint/*` to `pnpm-workspace.yaml`, `oxlint-config` to `nx.json` `release.projects`, and `packages/oxlint/*` to the `projects` list in the root `vitest.config.ts`.
- The skeleton copies `packages/eslint/arrow-fits-line`: `eslint.config.ts`, the `tsconfig*.json` files, `vitest.config.ts`, `README.md`, `CHANGELOG.md`, `LICENSE`, and the `nx` field in `package.json`. The relative `../../../` paths work unchanged at the same depth.
- Release needs no tool change: `release.yml:118-134` publishes every project except `lint-suite` in the rules batch, and `package-consumer-packing.spec.util.ts:71-105` packs every release project from `dist`.

### Entry points (subpath exports)

| Subpath          | Source                | Contents                                                                                                                                                                                                                                                            |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`              | `src/index.ts`        | oxlint config objects: `base`, `javascript`, `typescript`, `typescriptTypeAware`, `angular`, `rxjs`, `boundaries`, `vitest`, `playwright`, `storybook`, `recommended`; and the `defineLintSuiteConfig(...configs)` helper (see Composition)                         |
| `./local-plugin` | `src/local-plugin.ts` | Default export: one JS plugin, `meta.name: 'local'`. It holds the 17 type-free lint-suite rules (all 18 of `typescript-local-plugin.ts:22-41` except `no-unused-exports`), under the same keys, so `local/<rule>` names and `eslint-disable` comments keep working. |
| `./eslint`       | `src/eslint.ts`       | `oxlintOverlap(config: OxlintConfig)`: returns an ESLint flat config array that turns off every rule enabled in `config`                                                                                                                                            |

Every subpath export carries a `development` condition pointing at its `src/*.ts` file, like the rule packages do. The manifest build strips it on publish (`build-package-manifest.ts:84-96`).

### Composition

- Every export is a plain `OxlintConfig` object, typed with `defineConfig` from `oxlint`. `defineConfig` returns its input unchanged (`oxlint/dist/index.d.ts:7080`).
- **oxlint ignores `settings`, `globals`, `env` and `ignorePatterns` at the top level of an extended config.** It honors them only at the root. Overrides inside an extended config do keep their `globals` (all confirmed on 1.88; an override with `settings` fails to parse). So a plain `{ extends: [recommended] }` would silently lose `boundaries/elements`.
- Users therefore compose with the helper, in an `oxlint.config.ts`: `export default defineLintSuiteConfig(recommended, angular, vitest, { rules: { … } })`.
  - It returns `{ extends: configs, settings, globals, env, ignorePatterns }`.
  - `settings`, `globals` and `env` are merged from the root of every config in the `extends` tree, recursively, later wins.
  - `ignorePatterns` is concatenated the same way.
  - The user's own config goes in as the last argument, so its root-only fields are hoisted too. The preset exports set no root `globals` or `env` (theirs live in overrides).
  - Confirmed on 1.88: with a helper-shaped root, rules and `jsPlugins` two levels down in `extends` still run, and root `settings` and `ignorePatterns` reach them.
  - User chose this helper over a `rootOptions` spread object (2026-10-15).
- `.oxlintrc.json` is not supported, because its `extends` only takes file paths. README says so.
- `recommended` is `{ extends: [base, javascript, typescript, boundaries] }`.
- `typescriptTypeAware` is a layer, not a superset: it holds `options.typeAware: true` and one override with the 27 typed `typescript/*` rules, using the ESLint TS globs (`**/*.ts`, `**/*.tsx`, `**/*.cts`, `**/*.mts`). The 27 are set the same way on every TS sample, so no spec or e2e off-overrides are needed (confirmed). Users add it next to `recommended`.
- Framework exports (`angular`, `rxjs`, `vitest`, `playwright`, `storybook`) are opt-in and meant to be added next to `recommended`, as in ESLint.
- Confirmed with oxlint 1.88: `categories`, `options.typeAware` and `plugins` set inside an extended config are honored, and `plugins` lists from several extends are unioned.

### Precedence model

oxlint does not merge like ESLint. Confirmed: it applies every override after every top-level rule, whatever the `extends` order. So for a file:

1. Top-level `rules` merge last-wins: each extended config in order (recursively), then the config's own `rules`.
2. Then every override whose `files` matches the file, in the same order (extended configs' overrides first, then the config's own), last-wins.

3. `settings`, `globals`, `env` and `ignorePatterns` count only at the root config. Inside `extends`, only override `globals` count.

`src/utils/resolve-oxlint-config.util.ts` implements this once. It returns the final merged rules, `plugins`, `jsPlugins`, `settings` and `globals` for a path. Both `oxlintOverlap` and the parity spec use it. Glob matching uses Node's `path.matchesGlob` (no new dependency).

Config shape follows from this: a rule ESLint enables for every JS and TS sample goes at top level; a rule ESLint scopes narrower goes in an override with the ESLint `files` globs. An override beats every top-level rule, but not a later override. So a layer extended later that enables a rule inside an override must repeat any earlier off-override for that rule. No such case exists today. Parity catches one if it appears.

### Build tool change

1. `tools/src/build-package-context.ts:61-64` hard-codes the entry names: `['index']` for rule packages and three names for the umbrella. Change it to derive them from the manifest's `exports` keys, skipping `./package.json`: `.` becomes `index`, and `./x` becomes `x`. For the umbrella this produces the same three entries as today (key order `./package.json, ./eslint, ./stylelint, ./prettier`).
2. `tools/src/build-package-manifest.ts:99-105` hard-codes `files`, and `:126` copies only `README.md`, `LICENSE`, `CHANGELOG.md`. Add `MISSING.md` to both, but only when the file exists in the package root, so no existing package's manifest changes.
3. Build and declaration output for every existing package must stay byte-identical. `build-package.consumer.spec.ts` plus a before/after diff of `dist/` check that.
4. The new package takes the non-umbrella declaration path. That path used to pull 5 `shared/rule-internals` sources into `dist/internal/*.d.ts`, which nothing references: this package's own sources never import `rule-internals`; the rule packages behind `local-plugin.ts` do. `build-package-private-sources.ts` now emits only the private sources reached from the package's own sources without passing through another package, so this package ships no `internal/` folder. Every other package's `dist` stays byte-identical (dist diff), because their private sources are all reached from their own sources.

## Config modules

- One module per preset in `src/lib/<preset>.ts`, each exporting a typed oxlint config object.
- The rule entries are translated from the matching `packages/lint-suite/src/lib/*.ts`.
- **Every export sets `categories: { correctness: 'off' }` at its top level** and lists the native `plugins` its rules use (`import`, `vitest`, …). Without `categories`, oxlint enables its default correctness set (112 rules, confirmed). Without `plugins: ['import']`, `import/*` rules are silently skipped (confirmed). `eslint`, `unicorn`, `typescript` and `oxc` are always on in oxlint.
- **The JS plugin list below is closed.** Any ESLint rule that has no native oxlint rule and no plugin on that list goes in `MISSING.md` under "Not implemented in oxlint". That covers type-free `@typescript-eslint/*`, `@vitest/*` and `import-x/*` rules without a native version. It includes `import-x/no-unresolved`, `import-x/order` and `import-x/no-useless-path-segments`: running import-x as a JS plugin would need a non-reserved alias, which breaks "keep ESLint names".

### Settings, globals and ignores

- ESLint `settings` go to the export's top-level `settings` with the same keys and values; `defineLintSuiteConfig` hoists them to the root. Overrides can't hold `settings` (`index.d.ts:793+`). That covers `boundaries/elements` and `import/resolver` (`boundaries.ts:19-51`). The `import/resolver: { typescript }` setting is read by `eslint-plugin-boundaries`, so `eslint-import-resolver-typescript` is a dependency.
- Every `import-x/*` setting is dropped: `import-x/resolver-next` (`typescript-imports.ts:53-59`) and the `import-x/extensions`, `external-module-folders`, `parsers` and `resolver` that `importPluginX.flatConfigs.typescript` adds (`typescript-recommended.ts:8-10`). Only `import-x` rules read them, and oxlint's native `import` plugin resolves on its own. `MISSING.md` notes this under behaviour gaps.
- Settings live at the root, so every linted file gets all of them, while ESLint scopes some (e.g. `boundaries.ts:7-14` leaves `.cjs`/`.mjs` out). Extra settings on a file are harmless: only the plugin that owns a key reads it, and only where its rules run.
- ESLint `languageOptions.globals` always go to oxlint `globals` inside an override with the ESLint `files` (`javascript.ts:14`, `angular.ts:18-22`), never at top level, because override `globals` survive `extends`.
- `ignores: ['!.storybook']` in `storybook.ts:6` sits in a block with `files`, so it is block-scoped and, being only a negation, ignores nothing. It is not ported. No export sets `ignorePatterns`; `defineLintSuiteConfig` still hoists any the user passes. No preset uses `ignores` to scope a block, so `excludeFiles` is never used. `oxlintOverlap` does not support it, and the parity spec fails if a config sets it.

### Rule-name map

`src/utils/rule-name.util.ts` maps ESLint rule names to oxlint rule names. `oxlintOverlap` uses it in reverse, and so does the parity spec.

- core `x` → `eslint/x`
- core rules oxlint lacks natively → `eslint-js/x`, served by `oxlint-plugin-eslint` (its `meta.name` is `eslint-js`): `no-restricted-syntax`, `spaced-comment`, `no-octal`, `no-dupe-args`
- `@typescript-eslint/x` → `typescript/x`, except the 19 extension rules oxlint has only as `eslint/x` (no `typescript/x` in oxlint 1.88, and typescript-eslint ships a same-named rule): `class-methods-use-this`, `default-param-last`, `init-declarations`, `max-params`, `no-array-constructor`, `no-dupe-class-members`, `no-empty-function`, `no-loop-func`, `no-loss-of-precision`, `no-magic-numbers`, `no-redeclare`, `no-restricted-imports`, `no-shadow`, `no-unused-expressions`, `no-unused-private-class-members`, `no-unused-vars`, `no-use-before-define`, `no-useless-constructor`, `prefer-destructuring`. Both ESLint names map to `eslint/x`. The core and TS rule of a pair are never both on for the same sample (confirmed 2026-10-15: 7 parity passes × 14 samples × 19 rules, 0 pairs both on), so the mapping is safe.
- `import-x/x` → `import/x`
- `vitest/x` → `vitest/x`
- JS-plugin rules keep their ESLint names exactly. Each JS plugin is registered as `{ name: <ESLint prefix>, specifier }`, so the prefix always matches. That covers `local`, `lint-suite-angular`, `modular-boundaries`, `@smarttools/rxjs`, `@angular-eslint`, `boundaries`, `@stylistic`, `playwright`, `storybook`, `eslint-js`. Scoped aliases load and report under these exact prefixes (confirmed).
- The ESLint rxjs preset registers the plugin only as `@smarttools/rxjs`, the prefix the map knows.

### JS plugin specifiers

- Every specifier is a `file://` URL from `import.meta.resolve(<bare specifier>)` in the preset module. Relative specifiers are not used: `./local-plugin` resolves against `src/lib/<preset>.ts` in source and against `dist/index.js` after bundling. esbuild leaves `import.meta.resolve` untouched, and oxlint accepts `file://` URLs from an extended config (both confirmed).
- The local plugin uses a self-reference: `import.meta.resolve('@lint-suite/oxlint-config/local-plugin')`.
- Plugins:
  - `@lint-suite/oxlint-config/local-plugin` (`local`)
  - `@lint-suite/eslint-no-unused-angular-fields` (`lint-suite-angular`)
  - `@lint-suite/eslint-modular-boundaries` (`modular-boundaries`)
  - `@angular-eslint/eslint-plugin` (`@angular-eslint`). `angular-eslint`'s default export has no rules; the TS plugin is only the named `tsPlugin` export. So this package depends on `@angular-eslint/eslint-plugin` directly. Its default export is that plugin. It has no `meta.name`, so the alias is required.
  - `@smarttools/eslint-plugin-rxjs` (`@smarttools/rxjs`)
  - `eslint-plugin-boundaries`, `@stylistic/eslint-plugin`, `eslint-plugin-playwright`, `eslint-plugin-storybook`
  - `oxlint-plugin-eslint` (`eslint-js`)

### Type info

- **Rules that need type info are never put in a non-type-aware config.** Under oxlint they throw, and that kills every JS-plugin rule in the file (confirmed on 2026-10-15). They go in `MISSING.md`:
  - rxjs: 21 rules.
  - angular-eslint `no-developer-preview`, `no-experimental`, `no-uncalled-signals`, `reactive-context-must-read-signal` (exactly these 4 throw, confirmed)
  - `@typescript-eslint/naming-convention`, `@typescript-eslint/no-unsafe-enum-assignment` (typed, and tsgolint does not implement them)
  - `local/no-unused-exports`
- ESLint `recommended` enables 29 typed `@typescript-eslint` rules for `.ts`. The two above go in `MISSING.md`. The other 27 are implemented by tsgolint (all `type_aware` in `oxlint --rules`, confirmed) and live only in `typescriptTypeAware`. They are listed in `MISSING.md` under "Type-aware only".
- `rxjs` holds the 5 type-free rules from the ESLint rxjs preset: `@smarttools/rxjs/no-ignored-replay-buffer`, `no-ignored-takewhile-value`, `no-index`, `no-internal`, `no-sharereplay`. The preset enables 26 rxjs rules in all: those 5 plus the 21 above.
- `angular` includes `lint-suite-angular/no-unused-angular-fields` with `analysis: 'local'`, because project mode throws without parser services. `MISSING.md` records this in Option deviations.
- `typescriptTypeAware` needs `oxlint-tsgolint` (optional peer). It bundles a typescript-go (TS 7) binary, so consumers don't need TS 7 installed; it ran by hand on this TS 6 repo, not in CI. Parity checks its contents as config. README says so.

## `MISSING.md`

- Lives at `packages/oxlint/config/MISSING.md` and is published (Build tool change 2).
- One table per cause. Each rule row's first cell is the ESLint rule name in backticks.
  - A rule appears in exactly one cause table. The parity spec fails on duplicates.
  - A row means the rule is missing for every file the ESLint presets apply it to. If parity finds a rule ported for some sample files but not others, the spec fails; add a `Scope` column then, not before.
- Causes and their trackers:

| Cause                                  | Tracker                   | What brings the rules back                                                                 |
| -------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| Needs type info, no oxlint path        | oxc#19596                 | Type info in JS plugins, or the rule building its own `ts.Program` (S2)                    |
| Type-aware only                        | —                         | Already ported in `typescriptTypeAware`; needs tsgolint and TS 7                           |
| Angular templates (`.html` and inline) | oxc RFC #21936, PR #24262 | Language plugins or custom parsers (plus processor support for inline templates) in oxlint |
| JSON                                   | oxc#18656, RFC #21936     | JSON linting in oxlint                                                                     |
| Not implemented in oxlint              | per row                   | Native implementation in oxlint                                                            |
| Failed the smoke test                  | per row, with the error   | A fix in the plugin or in oxlint                                                           |

- An `Option deviations` table lists rules that are ported with options different from ESLint's: rule name, ESLint options, oxlint options, reason. A rule here is ported, so it must not also be in a cause table.
  - Today its only row is `lint-suite-angular/no-unused-angular-fields`: `analysis: 'local'` in oxlint, `'project'` in ESLint.
  - Parity treats a row here as an allowed options mismatch for that rule only.
- Short sections without rule rows cover behaviour gaps:
  - `local/no-call-in-condition` has no checker, so its type-predicate exemption is skipped and it gives more reports.
  - Project-mode `no-unused-angular-fields` is lost when `oxlintOverlap` turns the ESLint rule off. To keep it, re-enable it in ESLint and turn it off in oxlint.
  - `import-x/resolver-next` has no oxlint counterpart; the native `import` plugin resolves on its own.
  - No editor support for `.html`/`.json`.
  - Cross-file rules (`modular-boundaries`) depend on oxlint running JS plugins on a single thread.

## `oxlintOverlap`

- `oxlintOverlap(config)` walks the same layers as the shared resolver (see Precedence model): the merged top-level rules, then every override in order. Each enabled oxlint rule is mapped back to its ESLint names with the rule-name map and turned off in ESLint:
  - Top-level rules get blocks with `files` set to the extensions oxlint lints (`**/*.js`, `**/*.ts`, …), so ESLint keeps them on for `.html`, `.json` and other files oxlint never lints.
  - Rules an override enables get blocks scoped to that override's `files` AND an oxlint extension. A glob that already ends with an oxlint extension (`**/*.spec.ts`) is kept as is; any other glob (`scripts/**`) is paired with each extension glob as an ESLint nested `files` entry (`[['scripts/**', '**/*.ts'], …]`, an inner array means every pattern must match, confirmed with `calculateConfigForFile` on ESLint 10.12). So ESLint keeps the rule on for `scripts/a.html` and `scripts/a.json`. A rule already off for every oxlint file at top level is not repeated.
  - If a later override turns a rule off, the block gets that override's raw `files` as `ignores`. Ignoring more than oxlint lints only keeps the rule on in ESLint, which is the safe direction. Rules with the same `ignores` share a block. So no rule ends up running in neither tool (spec: `eslint.composed.spec.ts`, every rule ESLint enables on a sample still runs in ESLint or oxlint, including a user `scripts/**` override that turns a rule off and one that enables `max-lines` only under `scripts/**`; plus a user pass with `ignorePatterns: ['generated/**']` and a `scripts/**` override that turns off `@typescript-eslint/no-explicit-any` and `import-x/no-self-import` by their aliases, sampled on `generated/a.ts`).
- Rule keys are read the way oxlint 1.88 reads them (probed with `--print-config` and real runs):
  - Aliased spellings are made canonical before anything else: an `eslint-plugin-` prefix is dropped, `@typescript-eslint` → `typescript`, `import-x` → `import`, `jsx_a11y` → `jsx-a11y`, `react_perf` → `react-perf`, `react-hooks` → `react`, `@next/next` → `nextjs`, `deepscan` → `oxc`, and `typescript/<x>` → `eslint/<x>` for the TypeScript extension rules. So `'typescript/default-param-last': 'off'` in an override turns off `eslint/default-param-last`, as in oxlint.
  - A bare rule name (`'no-null'`) throws with the name, where it is (`extends[1].overrides[0].rules`) and the fix. `oxlintOverlap` and `resolveOxlintConfig` both call the same `assertPrefixedRuleKeys` on the whole config tree before anything else, so the overlap and the parity oracle can't disagree, and an override that matches no file is checked too. The user chose this over shipping a name catalog (2026-10-15). oxlint resolves it through its own registry (eslint first, then plugin order, e.g. `no-null` → `unicorn`), which is not exposed to JS, so guessing would risk a wrong ESLint name.
  - A built-in rule counts only when its plugin is enabled. The enabled set is `eslint` (always on) plus the union of every config node's `plugins` across `extends`, where a node without `plugins` contributes the defaults `unicorn`, `typescript`, `oxc`. oxlint drops other built-in rules silently. An override's own `plugins` count for that override's rules only (probed with real runs, `SP/ox/ovp/probe.mjs`): a rule an override enables with its own `plugins` runs for its files; another override's `plugins` don't help, a top-level rule is not revived, and a later override that turns the rule off without listing the plugin is ignored. Exception: with `import` only in an override, oxlint builds no module graph, so `import/default`, `export`, `named`, `namespace`, `no-cycle`, `no-named-as-default`, `no-named-as-default-member` and `no-self-import` never report there (`import/export` still reports local duplicates but misses star-export conflicts, so it counts as not running: ESLint keeps it, which may double-run but never loses it). The other 25 import rules report the same in both setups. `oxlintOverlap` and `resolveOxlintConfig` share `overrideRunnableRules` for this. JS-plugin rules always count, because an undeclared JS plugin is a hard oxlint error.
  - Root `ignorePatterns` (gitignore semantics: a pattern without `/` matches at any depth, a leading `/` anchors it, a directory pattern covers its contents, `!` re-includes) become `ignores` on every block, as `<glob>` and `<glob>/**`, so ESLint keeps every rule on for files oxlint never lints. oxlint also skips `.gitignore`d files; `oxlintOverlap` does not read `.gitignore`, so a user adds `includeIgnoreFile` from `@eslint/compat` to ESLint when both tools must agree there.
  - oxlint lints the `<script>` blocks of `.vue`, `.svelte` and `.astro` files (probed), but those extensions stay out of the overlap blocks: ESLint keeps every rule on for them.
- An ESLint block with no `files` that sets `'off'` for a rule whose plugin isn't loaded does not throw on `.json`, `.js` or `.ts` files (confirmed).
- It does not use `eslint-plugin-oxlint`. That plugin reads `categories` only from the top level and ignores them inside `extends` (its `dist/index.mjs:466-481,517`), so it would turn off about 100 extra ESLint rules. It also skips JS-plugin rules (eslint-plugin-oxlint#682). The hand-kept name map already holds every name we need. The user approved dropping `eslint-plugin-oxlint` (2026-10-15).

## Tests

All tests sit next to the code, with helpers under `src/test/`, following the repo's test layout.

1. **`parity.spec.ts`**
   - Samples (from research, `effective.mjs:8`): `src/a.ts`, `a.js`, `a.cjs`, `a.mjs`, `a.spec.ts`, `a.test.ts`, `a.e2e.ts`, `a.stories.ts`, `a.html`, `a.json`, `a.action.ts`, `a.state.ts`, `a.stub.ts`, `a.util.ts`.
   - ESLint side: `ESLint.calculateConfigForFile` per sample, with `overrideConfigFile: true` and the preset arrays from `lint-suite`. An `undefined` result counts as zero rules.
   - oxlint side: the shared resolver. oxlint has no per-file resolution API, and `--print-config` ignores the path and does not apply overrides (confirmed). For samples oxlint never lints (`a.html`, `a.json`: the walker keeps only JS/TS-family extensions), the oxlint side is zero rules whatever the config says.
   - Passes. The oxlint side is always what users write, `defineLintSuiteConfig(...)`. Each pass uses the documented ESLint order (`README.md:120-128`, `recommended` first):
     1. ESLint `recommended` ↔ oxlint `defineLintSuiteConfig(recommended)`. Rules in "Type-aware only" must be absent from oxlint.
     2. ESLint `recommended` ↔ oxlint `defineLintSuiteConfig(recommended, typescriptTypeAware)`. Rules in "Type-aware only" must be present with equal severity and options. Every other `MISSING.md` row still applies.
     3. For each framework export X: ESLint `[...recommended, ...X]` ↔ oxlint `defineLintSuiteConfig(recommended, X)`. For `angular`, the ESLint side is `[...recommended, ...angular, ...angularTemplate]`; all `angularTemplate` rules are expected under "Angular templates".
   - Per pass and sample, assert that each enabled ESLint rule either exists under its mapped name with equal severity and deep-equal options (except Option deviations), or appears in `MISSING.md`.
   - Reverse: no `MISSING.md` rule is enabled in the oxlint config (except "Type-aware only" in pass 2), and no enabled oxlint rule lacks an enabled ESLint counterpart.
   - Settings and globals, per sample oxlint lints:
     - Settings are checked one way: each ESLint `settings` key, minus the dropped `import-x/*` keys, appears in oxlint with a deep-equal value. Extra oxlint keys are allowed.
     - The oxlint `globals` deep-equal the ESLint `languageOptions.globals`.
     - Samples oxlint never lints are skipped here too.
   - Plugins: each enabled oxlint rule's prefix is in the resolved `plugins`, in the always-on set (`eslint`, `unicorn`, `typescript`, `oxc`), or in the `jsPlugins` names.
   - `MISSING.md`: no rule in two cause tables, and no Option deviations rule in a cause table.
   - The Markdown table reader lives in `src/test/utils/`.
2. **`smoke.spec.ts`**
   - Runs the oxlint binary from the `oxlint` npm package (devDependency): resolve `oxlint/package.json`, join `bin/oxlint`, then `spawnSync(process.execPath, [bin, '-c', <config>, '-f', 'json', ...files])`. `bin/oxlint` is not in oxlint's `exports`, and `.bin/oxlint.cmd` can't be spawned without a shell on Windows. oxlint exits 1 when it reports errors, so the spec reads the JSON output and does not treat exit 1 as failure.
   - `env.NODE_OPTIONS = '--conditions=development'`, so the workspace rule packages load from source. Without it, Node fails with `ERR_MODULE_NOT_FOUND` on `@lint-suite/eslint-arrow-fits-line/index.js` (confirmed).
   - The config is a fixture `oxlint.config.ts`: `defineLintSuiteConfig(recommended, ...every framework export)`. The `boundaries` and `modular-boundaries` triggers prove that hoisted `settings` reach the plugins in real oxlint.
   - Fixtures live in `src/test/fixtures/workspace/`, a small Nx-style workspace: `package.json`, `nx.json`, and two projects with `project.json` and tags. `modular-boundaries` finds projects through those markers (`modular-boundaries.const.ts:14-28`). Its folders also match the `boundaries/elements` patterns. Each fixture file starts with a comment naming the rule it triggers. One trigger per JS plugin:

     | JS plugin            | Fixture                                                 | Trigger                                                                    |
     | -------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
     | `local`              | any `.ts` file                                          | `local/one-line-guard`                                                     |
     | `eslint-js`          | any `.ts` file                                          | `eslint-js/spaced-comment` (`//x`)                                         |
     | `@stylistic`         | any `.ts` file                                          | `@stylistic/padding-line-between-statements` (a rule `prettier` leaves on) |
     | `boundaries`         | an import across element types the settings forbid      | a `boundaries/*` rule                                                      |
     | `modular-boundaries` | an import from one project into another the tags forbid | `modular-boundaries/*`                                                     |
     | `@angular-eslint`    | a component                                             | `@angular-eslint/prefer-output-readonly`                                   |
     | `lint-suite-angular` | the same component with an unread private field         | `lint-suite-angular/no-unused-angular-fields`                              |
     | `@smarttools/rxjs`   | an rxjs file                                            | `@smarttools/rxjs/no-sharereplay`                                          |
     | `playwright`         | an `.e2e.ts` file                                       | any enabled `playwright/*` rule                                            |
     | `storybook`          | a `.stories.ts` file                                    | any enabled `storybook/*` rule                                             |

   - Asserts zero `Error running JS plugin` and every trigger in the table reported.
   - Runs `--print-config` on the same config and compares it with the resolver's top level. The comparison covers native rule names and severities only, after normalization (`eslint/no-console` → `no-console`, `error` → `deny`). `plugins` must equal the declared set plus the defaults (`unicorn`, `typescript`, `oxc`). `--print-config` leaves out JS-plugin rules and `jsPlugins`, and drops options for rules from `extends`, so neither is compared (confirmed). This catches leaked default categories and dropped plugins, which the object-level parity spec can't see.
   - `testTimeout` raised in this package's `vitest.config.ts` (vitest's default is 5 s).
   - Any third-party rule that fails here moves to `MISSING.md` under "Failed the smoke test", together with the error.
3. **`eslint.spec.ts`**: covers `defineLintSuiteConfig(recommended)`, `defineLintSuiteConfig(recommended, typescriptTypeAware)`, and `defineLintSuiteConfig(recommended, X)` for each framework export.
4. **`define-lint-suite-config.spec.ts`**: `settings`, `globals`, `env` and `ignorePatterns` from nested `extends` (e.g. `boundaries` inside `recommended`) and from the user's own last argument end up at the root, and later configs win on a key. For each, `oxlintOverlap` turns off exactly the ESLint names of the rules enabled in the resolved state, JS-plugin rules included, with matching `files` for override-only rules, and nothing else.

## Dependencies

- `dependencies` (`workspace:*` or catalog):
  - the 17 `@lint-suite/eslint-*` packages behind the local plugin (all of `typescript-local-plugin.ts` except `@lint-suite/eslint-no-unused-exports`)
  - `@lint-suite/eslint-modular-boundaries`, `@lint-suite/eslint-no-unused-angular-fields`
  - `@angular-eslint/eslint-plugin` (add to the `angular` catalog at the version `angular-eslint` uses, 22.5.0)
  - `@smarttools/eslint-plugin-rxjs`, `eslint-plugin-boundaries`, `eslint-import-resolver-typescript`, `@stylistic/eslint-plugin`, `eslint-plugin-playwright`, `eslint-plugin-storybook` (existing catalogs)
  - `oxlint-plugin-eslint` (new `oxlint` catalog)
- `peerDependencies`. `build-package-manifest.ts:27-35` replaces a `catalog:` value with the exact catalog version, so ranges come from `*-compatibility` catalogs, following `typescript-compatibility`:
  - `oxlint`: new `oxlint-compatibility` catalog, `>=1.88.0`
  - `oxlint-tsgolint`: optional, new entry in `oxlint-compatibility`
  - `typescript`: `catalog:typescript-compatibility` (`>=6.0.3`), as the rule packages have it. TS 7 matters only for `typescriptTypeAware`; README says so.
  - `eslint`: required, `catalog:base`. The Risks check failed: `@typescript-eslint/utils` (`FlatESLint.js:8`) does `require('eslint')`, so 4 JS plugin specifiers and `./local-plugin` fail to import without it.
- `devDependencies`: `oxlint` pinned to `1.88.0` in the new `oxlint` catalog.

## Out of scope

- Typed rules building their own `ts.Program` (follow-up S2).
- Upstream oxc work (#24262, language plugins) and the #21936 post.
- Running oxlint on this repo's own code in CI.
- First npm publish and OIDC trust for the new package. The user does this locally.

## Risks

- JS plugins are alpha with weekly releases. The `oxlint` dev pin is what the tests prove; the `>=1.88.0` peer range is a promise beyond that.
- Users who write `{ extends: [...] }` without `defineLintSuiteConfig` lose `settings` and `ignorePatterns` silently, and `boundaries` reports nothing. README leads with the helper.
- The shared resolver implements oxlint's precedence as probed on 1.88. If oxlint changes it, parity keeps passing on the old model; only the smoke `--print-config` check (top level only) would notice.
- `typescriptTypeAware` ran once by hand in this repo (TS 6; `oxlint-tsgolint` bundles its own typescript-go binary), not in CI. Two of its rules, `prefer-optional-chain` and `no-unnecessary-condition`, are in oxlint's `nursery` category and may not run or may change.
- `eslint` at runtime: the rule packages and the third-party JS plugins (angular, storybook, playwright, boundaries) declare `eslint` as a peer. If any of them imports `eslint` at runtime, oxlint-only users need it installed, and the `eslint` peer must become required. Check this while implementing: load each plugin specifier from `dist` in a directory without `eslint`.
- Duplicate plugin registration (oxc#26017) if a user also lists one of our JS plugins themselves.
