# Missing rules

Rules the lint-suite ESLint presets enable that `@lint-suite/oxlint-config` does not run, grouped by cause. A rule appears in exactly one table.

## Needs type info, no oxlint path

Comes back with type info in JS plugins, or with the rule building its own `ts.Program`.

| Rule                                                | Tracker   |
| --------------------------------------------------- | --------- |
| `@angular-eslint/no-developer-preview`              | oxc#19596 |
| `@angular-eslint/no-experimental`                   | oxc#19596 |
| `@angular-eslint/no-uncalled-signals`               | oxc#19596 |
| `@angular-eslint/reactive-context-must-read-signal` | oxc#19596 |
| `@smarttools/rxjs/finnish`                          | oxc#19596 |
| `@smarttools/rxjs/no-create`                        | oxc#19596 |
| `@smarttools/rxjs/no-cyclic-action`                 | oxc#19596 |
| `@smarttools/rxjs/no-exposed-subjects`              | oxc#19596 |
| `@smarttools/rxjs/no-ignored-error`                 | oxc#19596 |
| `@smarttools/rxjs/no-ignored-notifier`              | oxc#19596 |
| `@smarttools/rxjs/no-ignored-subscription`          | oxc#19596 |
| `@smarttools/rxjs/no-implicit-any-catch`            | oxc#19596 |
| `@smarttools/rxjs/no-nested-subscribe`              | oxc#19596 |
| `@smarttools/rxjs/no-redundant-notify`              | oxc#19596 |
| `@smarttools/rxjs/no-subject-unsubscribe`           | oxc#19596 |
| `@smarttools/rxjs/no-subscribe-handlers`            | oxc#19596 |
| `@smarttools/rxjs/no-topromise`                     | oxc#19596 |
| `@smarttools/rxjs/no-unbound-methods`               | oxc#19596 |
| `@smarttools/rxjs/no-unsafe-catch`                  | oxc#19596 |
| `@smarttools/rxjs/no-unsafe-first`                  | oxc#19596 |
| `@smarttools/rxjs/no-unsafe-subject-next`           | oxc#19596 |
| `@smarttools/rxjs/no-unsafe-switchmap`              | oxc#19596 |
| `@smarttools/rxjs/no-unsafe-takeuntil`              | oxc#19596 |
| `@smarttools/rxjs/prefer-observer`                  | oxc#19596 |
| `@smarttools/rxjs/throw-error`                      | oxc#19596 |
| `@typescript-eslint/naming-convention`              | oxc#19596 |
| `@typescript-eslint/no-unsafe-enum-assignment`      | oxc#19596 |
| `local/no-unused-exports`                           | oxc#19596 |

## Type-aware only

Already ported in `typescriptTypeAware`; needs `oxlint-tsgolint` and TypeScript 7.

| Rule                                                | Tracker |
| --------------------------------------------------- | ------- |
| `@typescript-eslint/await-thenable`                 | —       |
| `@typescript-eslint/dot-notation`                   | —       |
| `@typescript-eslint/no-array-delete`                | —       |
| `@typescript-eslint/no-confusing-void-expression`   | —       |
| `@typescript-eslint/no-floating-promises`           | —       |
| `@typescript-eslint/no-generated-empty-object-type` | —       |
| `@typescript-eslint/no-misused-promises`            | —       |
| `@typescript-eslint/no-unnecessary-condition`       | —       |
| `@typescript-eslint/no-unsafe-argument`             | —       |
| `@typescript-eslint/no-unsafe-assignment`           | —       |
| `@typescript-eslint/no-unsafe-call`                 | —       |
| `@typescript-eslint/no-unsafe-member-access`        | —       |
| `@typescript-eslint/no-unsafe-return`               | —       |
| `@typescript-eslint/only-throw-error`               | —       |
| `@typescript-eslint/prefer-find`                    | —       |
| `@typescript-eslint/prefer-includes`                | —       |
| `@typescript-eslint/prefer-nullish-coalescing`      | —       |
| `@typescript-eslint/prefer-optional-chain`          | —       |
| `@typescript-eslint/prefer-readonly`                | —       |
| `@typescript-eslint/prefer-regexp-exec`             | —       |
| `@typescript-eslint/prefer-string-starts-ends-with` | —       |
| `@typescript-eslint/promise-function-async`         | —       |
| `@typescript-eslint/require-await`                  | —       |
| `@typescript-eslint/restrict-plus-operands`         | —       |
| `@typescript-eslint/restrict-template-expressions`  | —       |
| `@typescript-eslint/return-await`                   | —       |
| `@typescript-eslint/switch-exhaustiveness-check`    | —       |

## Angular templates

`.html` files and inline templates. Comes back with language plugins or custom parsers in oxlint, plus processor support for inline templates. `max-lines` is missing only for `.html` files: it is ported for JavaScript and TypeScript.

| Rule                                                       | Tracker                   | Scope   |
| ---------------------------------------------------------- | ------------------------- | ------- |
| `@angular-eslint/template/alt-text`                        | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/attributes-order`                | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/banana-in-box`                   | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/button-has-type`                 | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/click-events-have-key-events`    | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/conditional-complexity`          | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/elements-content`                | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/eqeqeq`                          | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/interactive-supports-focus`      | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/label-has-associated-control`    | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/mouse-events-have-key-events`    | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-any`                          | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-autofocus`                    | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-distracting-elements`         | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-duplicate-attributes`         | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-empty-control-flow`           | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-inline-styles`                | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-interpolation-in-attributes`  | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-negated-async`                | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-nested-tags`                  | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-non-null-assertion`           | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/no-positive-tabindex`            | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-at-else`                  | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-at-empty`                 | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-built-in-pipes`           | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-class-binding`            | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-contextual-for-variables` | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-control-flow`             | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-ngsrc`                    | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-self-closing-tags`        | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-static-string-properties` | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-style-binding`            | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/prefer-template-literal`         | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/role-has-required-aria`          | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/table-scope`                     | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/use-track-by-function`           | oxc RFC #21936, PR #24262 |         |
| `@angular-eslint/template/valid-aria`                      | oxc RFC #21936, PR #24262 |         |
| `lint-suite-angular-template/no-unstyled-classes`          | oxc RFC #21936, PR #24262 |         |
| `max-lines`                                                | oxc RFC #21936, PR #24262 | `.html` |

## JSON

Comes back with JSON linting in oxlint.

| Rule                        | Tracker   |
| --------------------------- | --------- |
| `json/no-duplicate-keys`    | oxc#18656 |
| `json/no-empty-keys`        | oxc#18656 |
| `json/no-unnormalized-keys` | oxc#18656 |
| `json/no-unsafe-values`     | oxc#18656 |

## Not implemented in oxlint

No native oxlint rule and no plugin from the closed JS plugin list. Comes back with a native implementation in oxlint.

| Rule                                | Tracker                              |
| ----------------------------------- | ------------------------------------ |
| `import-x/no-unresolved`            | none, oxlint 1.88 has no native rule |
| `import-x/no-useless-path-segments` | none, oxlint 1.88 has no native rule |
| `import-x/order`                    | none, oxlint 1.88 has no native rule |

## Failed the smoke test

Loaded as a JS plugin rule but failed under oxlint. Comes back with a fix in the plugin or in oxlint.

| Rule | Tracker | Error |
| ---- | ------- | ----- |

## Option deviations

Rules that are ported with options different from ESLint's. A rule here is ported, so it is in no cause table.

| Rule                                          | ESLint options                                          | oxlint options                     | Reason                                                                                           |
| --------------------------------------------- | ------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `lint-suite-angular/no-unused-angular-fields` | `{ analysis: 'project' }`                               | `{ analysis: 'local' }`            | Project mode throws without parser services, which oxlint JS plugins lack.                       |
| `preserve-caught-error`                       | `{ requireCatchParameter: false, errorClassNames: [] }` | `{ requireCatchParameter: false }` | oxlint rejects `errorClassNames` when it loads the config; the empty list is the ESLint default. |
| `vitest/no-conditional-expect`                | `{ expectAssertions: false }`                           | none                               | oxlint rejects any option for this rule when it loads the config; `false` is the ESLint default. |
| `vitest/no-focused-tests`                     | `{ fixable: true }`                                     | none                               | oxlint rejects any option for this rule when it loads the config; `true` is the ESLint default.  |

## Behaviour gaps

### `local/no-call-in-condition`

There is no type checker, so the type-predicate exemption is skipped and the rule gives more reports.

### `no-unused-angular-fields` in project mode

Project mode is lost when `oxlintOverlap` turns the ESLint rule off. To keep it, re-enable the rule in ESLint and turn it off in oxlint.

### `import-x/resolver-next`

oxlint has no counterpart. The native `import` plugin resolves on its own, so every `import-x/*` setting is dropped.

### Exports are layers of `recommended`

`typescript` alone lacks the shared core rules from ESLint's recommended set, because they live in `javascript`. `javascript` alone applies those rules to TypeScript files too. Use `recommended`, or add both.

### Editors

There is no editor support for `.html` and `.json` files.

### Cross-file rules

`modular-boundaries` depends on oxlint running JS plugins on a single thread.
