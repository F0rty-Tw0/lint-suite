# @lint-suite/eslint-plugin-modular-boundaries

`@lint-suite/eslint-plugin-modular-boundaries` is an ESLint rule that enforces dependency constraints between workspace projects by tag, without depending on Nx. It reads pnpm, npm, Turborepo, Nx and moon workspace files, and follows the semantics of Nx's `enforce-module-boundaries` rule except where [Differences from Nx](#differences-from-nx) says otherwise.

## Install

Requires Node.js 24+, ESLint ^10.9.1, and TypeScript 6.0.3+.

```sh
pnpm add -D @lint-suite/eslint-plugin-modular-boundaries eslint@^10.9.1 typescript@">=6.0.3" typescript-eslint
```

The rule needs a TypeScript-aware parser for `.ts` files but no type information. Installing the plugin does not configure a parser.

```js
// eslint.config.js
import modularBoundaries from '@lint-suite/eslint-plugin-modular-boundaries';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['**/*.ts'],
  languageOptions: { parser: tseslint.parser },
  plugins: { 'modular-boundaries': modularBoundaries },
  rules: { 'modular-boundaries/modular-boundaries': 'error' }
});
```

## Workspaces and projects

The workspace root is the nearest directory above the linted file that contains, in this order: `pnpm-workspace.yaml`, a `package.json` with a `workspaces` field, `nx.json`, a `turbo.json` without `extends`, or `.moon/workspace.yml`. Set the `workspaceRoot` option to skip the search. Without a workspace root, the rule does nothing.

Projects are the union of:

- `package.json` directories matched by `pnpm-workspace.yaml` `packages` or `package.json` `workspaces`,
- every `project.json` directory,
- moon projects from `.moon/workspace.yml` `projects` (globs, an id-to-path map, or `{ globs, sources }`).

Files are listed with `git ls-files`, so `.gitignore`d files are skipped; outside a git repository the rule walks the directory tree and skips `node_modules` and `.git`. Paths in `.nxignore` and in nested workspaces are dropped. A file outside every project is not checked.

A project's id is, first present: `project.json` `name`; `package.json` `nx.name`; the moon project id; `package.json` `name`; the project path relative to the workspace root.

## Tag sources

A project's tags are the union of:

| File (in project root) | Field |
| --- | --- |
| `project.json` | `tags` |
| `package.json` | `nx.tags` |
| `package.json` | top-level `tags` (this rule's own convention for plain workspaces) |
| `package.json` | implicit `npm:private` when `private` is true, else `npm:public` |
| `package.json` | implicit `npm:<keyword>` for each entry in `keywords` |
| `turbo.json` | `tags` |
| `moon.yml` | `tags` |

For example, in a plain pnpm workspace:

```json
// packages/feature/package.json
{
  "name": "@ws/feature",
  "tags": ["type:feature"],
  "dependencies": { "@ws/data": "workspace:*", "@ws/ui": "workspace:*" }
}
```

## Constraints

Constraints come from three places, checked in this order:

1. The `depConstraints` option, in array order.
2. Root `turbo.json` `boundaries.tags`, when `configSources.turbo` is not `false`.
3. `.moon/workspace.yml` `constraints.tagRelationships`, when `configSources.moon` is not `false`.

Turborepo `dependencies.allow` / `deny` constrain the tags of a tagged project's dependencies; `dependents.allow` / `deny` constrain the tags of the projects that import it. Turborepo lists also match package names.

```json
// turbo.json
{
  "boundaries": {
    "tags": {
      "web": { "dependencies": { "deny": ["internal"] } },
      "internal": { "dependents": { "allow": ["@t/admin"] } },
      "leaf": { "dependencies": { "allow": [] } }
    }
  }
}
```

A moon tag relationship lets a project with the tag import only projects carrying at least one of the listed tags.

```yaml
# .moon/workspace.yml
constraints:
  tagRelationships:
    next:
      - 'react-ui'
```

## Options

| Option | Type | Default |
| --- | --- | --- |
| `allow` | `string[]` | `[]` |
| `depConstraints` | `DepConstraint[]` | `[]` |
| `ignoredCircularDependencies` | `[string, string][]` | `[]` |
| `checkCircularDependencies` | `boolean` | `true` |
| `checkUndeclaredDependencies` | `boolean` | `true` |
| `configSources` | `{ turbo?: boolean; moon?: boolean }` | both `true` |
| `workspaceRoot` | `string`, absolute or relative to `process.cwd()` | found by search |

Unknown options, including the Nx options this rule does not support (`enforceBuildableLibDependency`, `banTransitiveDependencies` and others), are an ESLint configuration error.

### `depConstraints`

Each entry has the Nx shape and exactly one of `sourceTag` or `allSourceTags`:

- `sourceTag`: the constraint applies to projects carrying this tag.
- `allSourceTags`: the constraint applies to projects carrying all of these tags.
- `onlyDependOnLibsWithTags`: the imported project must carry at least one of these tags. `[]` allows only untagged projects.
- `notDependOnLibsWithTags`: the imported project must carry none of these tags.
- `bannedExternalImports`: npm imports matching any pattern are reported.
- `allowedExternalImports`: npm imports matching no pattern are reported. `[]` bans every npm import.

```js
'modular-boundaries/modular-boundaries': ['error', {
  depConstraints: [
    { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:ui'] }
  ]
}]
```

```js
'modular-boundaries/modular-boundaries': ['error', {
  depConstraints: [
    { sourceTag: 'type:feature', notDependOnLibsWithTags: ['type:data'] }
  ]
}]
```

```js
'modular-boundaries/modular-boundaries': ['error', {
  depConstraints: [
    { sourceTag: 'type:feature', bannedExternalImports: ['moment'] }
  ],
  checkUndeclaredDependencies: false
}]
```

When `depConstraints` is non-empty, a project that matches none of its entries cannot import other projects (`projectWithoutTagsCannotHaveDependencies`). Turborepo and moon constraints do not count for this check.

### `allow`

Import specifiers matching a pattern are never checked.

```js
'modular-boundaries/modular-boundaries': ['error', {
  depConstraints: [
    { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:ui'] }
  ],
  allow: ['@ws/*']
}]
```

### `ignoredCircularDependencies`

Unordered pairs of project id patterns. Both directed edges between matching projects are removed before the cycle check.

```js
'modular-boundaries/modular-boundaries': ['error', {
  ignoredCircularDependencies: [['@c/a', '@c/d']]
}]
```

### `checkCircularDependencies` and `checkUndeclaredDependencies`

`checkCircularDependencies: false` turns off the cycle check, and the project graph is never built. `checkUndeclaredDependencies: false` turns off `undeclaredDependency`.

```js
'modular-boundaries/modular-boundaries': ['error', {
  checkCircularDependencies: false
}]
```

### `configSources`

Turn off constraints read from `turbo.json` or `.moon/workspace.yml`.

```js
'modular-boundaries/modular-boundaries': ['error', {
  configSources: { turbo: false }
}]
```

## Checks

Each import gets at most one report. The checks run in this order and stop at the first report:

| # | Reports when | `messageId` |
| --- | --- | --- |
| 1 | a relative or absolute import lands in another project | `noRelativeOrAbsoluteImportsAcrossLibraries` |
| 2 | a project imports itself by package name or path alias | `noSelfCircularDependencies` |
| 3 | an npm import is banned, or not allowed, by a matching constraint | `bannedExternalImportsViolation` |
| 4 | an npm package, or a workspace package imported by name from a project with its own `package.json`, is not declared there (nor its `@types/` package); projects without a `package.json` use the root one | `undeclaredDependency` |
| 5 | the imported project can reach the importing project in the project graph | `noCircularDependencies` |
| 6 | `depConstraints` is non-empty and none of its entries matches the importing project | `projectWithoutTagsCannotHaveDependencies` |
| 7 | a matching constraint fails | `onlyTagsConstraintViolation`, `emptyOnlyTagsConstraintViolation`, `notTagsConstraintViolation` |

A malformed workspace file, or two projects with the same id or package name, is reported as `workspaceConfigError` on line 1 of every linted file in the workspace.

Imports are resolved by: relative path; workspace package name; `compilerOptions.paths` in the root `tsconfig.base.json`, else `tsconfig.json`; otherwise an npm package by specifier shape. `node:` and built-in modules, `#` subpath imports, URL schemes and unresolved aliases are skipped.

## Pattern dialects

Each pattern kind follows the tool whose config it comes from:

| Used for | Dialect |
| --- | --- |
| Workspace globs (pnpm, npm, moon), `.nxignore` lines | `*` is one path segment, `**` any depth, `{a,b}` alternatives; in workspace globs a leading `!` excludes |
| Tags in `sourceTag`, `allSourceTags`, `onlyDependOnLibsWithTags`, `notDependOnLibsWithTags` | Nx `hasTag`: `*` matches any project, including an untagged one; `/.../` is a regular expression; a pattern containing `*` is a wildcard; anything else is exact |
| `bannedExternalImports`, `allowedExternalImports`, `ignoredCircularDependencies` | Nx `mapGlobToRegExp`: `*` is any text and the rest is a regular expression, unescaped, so `.` matches any character |
| `allow` | Nx `matchImportWithWildcard`: a `/**` suffix is a prefix match, a `/*` suffix is one more segment, an inner `/**/` matches prefix and suffix, anything else is a regular expression |

External patterns match the full specifier, so `@nestjs/*` matches `@nestjs/common/testing`.

## Differences from Nx

- `notDependOnLibsWithTags` is checked on direct imports only. Nx also checks transitive dependencies.
- `undeclaredDependency` does not exist in this Nx rule (Nx has it in the separate `@nx/dependency-checks` rule). Turn it off with `checkUndeclaredDependencies: false` for strict parity.
- The project graph has import edges only. Nx also adds edges from `package.json` workspace dependencies and `implicitDependencies`. The graph also over-approximates imports: it reads specifiers with the TypeScript scanner, so it also sees the static prefix of `import('./x' + y)`, the argument of `foo.require('./x')`, and `declare module 'x'` names.
- `ignoredCircularDependencies` removes the matching edges before the reachability check. Nx ignores a cycle when any consecutive pair on the shortest path matches.
- Nx-only options (`enforceBuildableLibDependency`, `buildTargets`, `checkNestedExternalImports`, `checkDynamicDependenciesExceptions`, `banTransitiveDependencies`, `allowCircularSelfDependency`) are rejected, not ignored.
- Projects come from workspace files, not the Nx project graph. Projects that exist only through Nx inference plugins (no `project.json` and no `package.json`) are not found.
- `ignoredCircularDependencies` patterns use `mapGlobToRegExp` on project ids. Nx uses `findMatchingProjects` (minimatch, `tag:` and directory forms, `!` excludes).
- Relative or absolute imports that land in no project are skipped. Nx reports them as `noRelativeOrAbsoluteExternals`.
- `libs/...` and `apps/...` specifiers are not treated as absolute project imports, as Nx's workspace layout does.
- Angular secondary entry points get no exemption from the self-import check.
- `require.resolve` is not checked. `TSImportEqualsDeclaration`, `TSImportType` and expression-free template literals are, which Nx does not visit.
- npm targets are recognized by specifier shape, not by lockfile entries.
- `.nxignore` lines are anchored at the workspace root, not full gitignore semantics (a slash-less pattern does not match at any depth).

Not supported: folder-level tags (use `eslint-plugin-boundaries`), moon `enforceLayerRelationships`, and Turborepo `// @boundaries-ignore` comments (use `eslint-disable` comments).

The named `modularBoundariesRule` export is for composed plugin registries.
