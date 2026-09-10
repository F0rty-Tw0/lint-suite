# Contributing to Lint Suite

Thank you for your interest in contributing to Lint Suite! This document provides guidelines and instructions for contributing to this project.

## Getting Started

### Prerequisites

- Node.js 24 (CI pins its toolchain in `.github/workflows/ci.yml`)
- pnpm 11.25.0, pinned by the root `packageManager` field

### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/lint-suite.git`
3. Navigate to the project directory: `cd lint-suite`
4. Install dependencies: `pnpm install`

### Dependency Management

Published dependency versions are grouped by exported configuration in `pnpm-workspace.yaml`; root development dependencies are isolated in the `dev` catalog. Update an existing version there, then run `pnpm install` to refresh the lockfile.

The workspace uses strict catalog mode. Add new dependencies to the matching catalog and target manifest together with `--save-catalog-name`:

```bash
pnpm add --save-dev --save-catalog-name=dev <package>
pnpm --filter lint-suite add --save-catalog-name=<catalog> <package>
```

## Development Workflow

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run workspace checks: `pnpm exec nx run-many -t build typecheck lint test`
4. Commit the changes with a clear message. Conventional Commit formatting is encouraged, but release selection does not require it.

### Nx Target Configuration

Public-package `build`, `typecheck`, `lint`, `test`, and `nx-release-publish`
configuration lives in `nx.json` under `targetDefaults`. The defaults use
`{projectRoot}` instead of hard-coded package paths and are filtered to
`packages/**`, leaving the private helpers' and tools' inferred builds intact.

Only `"typecheck": {}` needs an empty declaration in each public package's
`project.json`; Nx infers the other targets and applies the shared defaults.
Add project-level configuration only for actual overrides. The umbrella retains
its build executor to override its inferred npm script and its lint command
to enable the `development` export condition.

Keep cache inputs, outputs, and build dependencies in the shared defaults.
Do not move these settings under `nx:run-commands`: that executor also runs
unrelated targets, including long-running watch tasks. Check the effective
configuration with `pnpm exec nx show project <project-name> --json` when
changing defaults; project overrides and inferred tasks can affect inheritance.

See the [Nx target defaults reference](https://nx.dev/docs/reference/nx-json#target-defaults).

## Pull Request Process

1. Update your fork to match the main repository
2. Push your changes to your fork
3. Create a pull request against the main repository
4. Fill in the PR template with all required information
5. Wait for a maintainer to review your PR
6. Address any feedback from the review

## Coding Standards

- Follow the ESLint rules defined in the project
- Write clear commit messages; [Conventional Commits](https://www.conventionalcommits.org/) are encouraged
- Maintain consistent code style
- Document new rules or configurations
- Include appropriate tests for new features

Shared typed lint settings live in the named `typescriptConfig` export in
`eslint.config.base.ts`. Tools and rule packages import it and compose their
own configs with `defineConfig`; only ESLint entrypoints use default exports.
Tools selects `tools/tsconfig.json` explicitly for typed linting; package
configs use the TypeScript project service.
The separate `workspaceConfig` adds Nx boundary checks for the umbrella.

## Adding New Rules

Custom rules live in separate packages, not in the umbrella's source tree:

- ESLint: `packages/eslint-plugin/<rule-name>`, named
  `@lint-suite/eslint-plugin-<rule-name>`.
- Stylelint: `packages/stylelint/<rule-name>`, named
  `@lint-suite/stylelint-<rule-name>`.
- Shared production helpers: `shared/rule-internals`.
- Shared test helpers: `shared/rule-test-support`.

1. Follow the nearest existing single-rule package's manifest, `src/index.ts`,
   project targets, and compiler/test configuration. Export one default plugin
   and, for ESLint, a descriptive named export such as `arrowBodyFitsLineRule`;
   do not expose internal constants or helpers.
2. Keep the rule's implementation, options/types, fixtures, and behavioral
   tests together. Use its public plugin in tests rather than importing the
   entire umbrella. Name fixture manifests `package.fixture.json` when they
   would otherwise be discovered as workspace projects.
3. Declare runtime dependencies and host peers in the owning package, using
   the existing catalogs. Private helpers are development workspace
   dependencies and are bundled into the public artifact, never published.
4. Add the public Nx project to the explicit `nx.json` release list.
   Build and release helpers resolve package names and roots from the Nx graph;
   there is no second inventory to update. Add its exact `workspace:*` dependency and
   intended configuration to the umbrella when it belongs in the suite.
   Never make a standalone package depend on the umbrella.
5. Add README installation/configuration, compatibility, options, and real
   valid/invalid examples; point rule metadata at that README. Include
   `LICENSE` and initialize `CHANGELOG.md`.
6. Build the package and pack its distributable directory, not its source
   directory. Install the tarball outside this repository with only its
   required hosts, lint real fixtures, and compile a consumer of its public
   declarations. Check the tarball for source, fixture, private-package, or
   workspace/catalog protocol leakage.

For example, after building `eslint-plugin-arrow-body-fits-line`:

```sh
pnpm --dir dist/packages/eslint-plugin/arrow-body-fits-line pack --pack-destination <temporary-directory>
```

Workspace build/typecheck/lint/test discovery covers all public packages and
both private helper projects. Shared implementation changes affect their
consumers; root build/compiler/catalog/lockfile inputs intentionally affect
all public packages.

## Release Process

### Preview all affected packages

```sh
pnpm run release:plan patch
```

Use `minor` or `major` instead of `patch` when required. This command prints
the common baseline and affected projects, then runs Nx version/changelog
generation in dry-run mode. It does not change tracked files or Git refs,
push, or publish. Selection compares committed `HEAD`, not uncommitted work.

The release list in `nx.json` is the single inventory of public packages.
Nx calculates affected projects between `release/success` and `HEAD`, including
dependents. A changed rule includes `lint-suite`; an umbrella-only change does
not release its rule dependencies. Unchanged siblings retain their versions.
Private helpers are excluded from publication but affect their public consumers.
Shared inputs are declared in `nx.json`, not in a separate release planner.

The chosen bump applies to every affected existing package, including the
umbrella. New scoped packages retain their initial `1.0.0` version on their
first publication. The umbrella keeps its existing version and changelog
history; legacy `v<version>` tags remain intact. Subsequent package tags use
`<project-name>@<version>`.

Without a `release/success` tag, the first migrated workflow selects every
public package. After that, all releases use one common successful baseline.
Do not release arbitrary subsets outside this workflow: the shared baseline
assumes every affected package is published before it advances.

### One-button release

Dispatch the **Release** workflow on `master` and choose patch, minor, or major.
The protected `Lint Suite` environment provides credentials. Runs are
serialized and are not cancelled during publication.

The workflow:

1. Checks out the dispatched `master` commit, including full history and tags.
2. Runs `pnpm run release:prepare <bump>`. The TypeScript helper selects
   affected public projects; Nx updates source versions, the lockfile, project
   changelogs, and creates one release commit with package tags.
3. Points `release/current` at that commit and atomically pushes the branch
   and tags. If nothing is affected, it stops without a release.
4. Builds the selected packages with their final versions.
5. Runs `nx release publish` for the rules, then for `lint-suite`.
6. Creates GitHub releases through Nx and advances `release/success` to the
   completed release commit.

The build step is explicit: filtered Nx publication does not run target
dependencies. Source manifests retain `workspace:*`; the TypeScript package
builder writes exact dependency versions into the published manifests.

Release commands run through `pnpm exec` and use the pinned npm 11 dependency.
Nx 23.2 expects npm 11's registry-query JSON shape; npm 12 changes that shape
and prevents native publication retries from recognizing existing versions.

`release:prepare` changes local files and creates local commits/tags. It does
not push or publish; use `release:plan` for local previews.

### First scoped publication

Before publishing, a maintainer must:

- Confirm npm organization `@lint-suite` exists and the publishing identity
  can create every public scoped package.
- Restrict the `Lint Suite` environment's deployment branches to `master`.
  Its protected secrets must not be available to feature-branch workflows.
- Configure `NPM_TOKEN` for registry lookups and publication. When using npm
  trusted publishing, configure each package's repository/workflow/environment
  mapping and retain any credentials required for registry lookups.
- Configure `RELEASE_TOKEN` to push release commits and tags to `master`,
  respecting branch protection.
- Permit `GITHUB_TOKEN` to create GitHub releases and retain `id-token: write`
  for npm provenance.

Every public package declares public access in `publishConfig`.
Local tests and dry runs cannot prove remote organization, token, or
trusted-publisher permissions.

### Retry an interrupted release

Dispatch the same workflow with **publish-current**. No project list is needed.
It checks out `release/current`, derives the release set from package tags
at that commit, rebuilds, and runs Nx publication without another version bump.
Nx skips existing package versions; missing versions are published. GitHub
releases are then created or updated, and the successful baseline advances.

Until `release/current` and `release/success` match, another normal release is
refused. Changes merged after the interrupted release remain for the next
normal release. Do not move these markers manually to bypass a failed release.
An already completed release cannot be retried.

Recovery uses the versioned source and lockfile, not archived tarballs.
There is no custom prepared-state file, checksum archive, or byte-for-byte
artifact-integrity comparison. Registry authentication and publication errors
remain failures; resolve them and retry the same release.

### TypeScript helpers

`tools` is a private Nx library. Its helpers run directly with Node 24's native
TypeScript support. `tsconfig.lib.json` covers production helpers;
`tsconfig.spec.json` covers specs, test support, and configuration files.
The inferred build target checks the library without emitting JavaScript, and
typecheck checks both configurations. Tests run through Vitest.

```sh
pnpm exec nx run tools:typecheck
pnpm exec nx run tools:lint
pnpm exec nx run tools:test
```

`tools/src/build-package.ts` coordinates bundling, declaration emission, and
published manifests. Tests use disposable Git repositories and isolated packed
consumers. Fixtures under `tools/src/test/fixtures` are excluded from Nx project
discovery, helper typechecking, and linting.
`tools:test` builds workspace packages, then runs release and packed-consumer
regressions through one `vitest.config.ts`. The root Vitest workspace uses the
same config; when invoking Vitest directly, build the packages first.

## Questions?

If you have any questions, feel free to open an issue or discussion in the repository.

## Code of Conduct

This project follows a code of conduct that expects all contributors to be respectful and inclusive. Harassment or harmful behavior will not be tolerated.
