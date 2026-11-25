# How to contribute

Thank you for helping with the Svelte renderer for A2UI. This guide covers the development setup, the checks a change must pass, and the conventions the repository follows. The conventions are the ones of the official [A2UI repository](https://github.com/a2ui-project/a2ui), so that the package can move there unchanged.

## Development setup

You need Node.js 22.17 or later (CI uses 22 and 24) and Corepack. The repository uses Yarn 4 workspaces. If `corepack` is not on your path, as with Node.js releases that no longer bundle it, install it first with `npm install -g corepack`.

```sh
corepack yarn install
corepack yarn workspace @conalog/a2ui-svelte build
```

The browser tests and the explorer's end-to-end tests use Playwright's Chromium. Install it once:

```sh
corepack yarn workspace @conalog/a2ui-svelte playwright install chromium
```

## Checks

Run these from `typescript/renderers/svelte` before you open a pull request:

| Command             | What it checks                                                         |
| ------------------- | ---------------------------------------------------------------------- |
| `yarn typecheck`    | `svelte-check` over the sources and tests, with warnings as errors     |
| `yarn test:unit`    | Unit tests and the conformance suites in jsdom                         |
| `yarn test:ssr`     | Importing and rendering in plain Node, as SvelteKit does on the server |
| `yarn test:browser` | The conformance suites and input behavior in Chromium                  |
| `yarn lint`         | ESLint, including the security rules                                   |
| `yarn format:check` | Prettier                                                               |
| `yarn lint:package` | Builds the package and runs `publint --strict` on it                   |

In `typescript/renderers/svelte/a2ui_explorer`, run `yarn typecheck` and `yarn test:e2e`. The end-to-end tests build the explorer and serve it with its Node server.

From the repository root, `node scripts/check-license-headers.mjs` checks that every source file carries the license header.

## Conformance suites

`conformance/` and `catalogs/basic/` hold files copied from the official repository at the commit named in `conformance/VENDORED.md`. Do not edit them here. To update them, check out the official repository and run:

```sh
node scripts/sync-official.mjs <path-to-a2ui-checkout>
```

Then run every check, fix what the new cases find, and commit the copy and the fixes separately.

A case the renderer cannot support goes into `UNSUPPORTED` in `tests/adapter_harness.ts` with a reason. The run fails when an entry no longer matches a case, so the list stays current.

## Staying within the official scope

The package does what the official renderers do, in Svelte's form. Before you add something the official repository does not have, such as a public API, a README section of guidance, or an explorer feature, ask whether it is worth being different. If it is, list it with its reason under "Differences from the official renderers" in the package README, or, for the explorer, under "Differences from the official repository" in the root README. A change that removes a difference should remove its entry.

## Code style

1. TypeScript follows the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html), checked by `gts` through ESLint. Prettier formats TypeScript, Svelte, JSON, YAML and Markdown.
2. Svelte components use runes. Components use PascalCase file names; other modules use the names of their counterparts in the official React renderer.
3. Import relative modules with their `.js` extension, and import the package's own modules relatively, never through `@conalog/a2ui-svelte`.
4. Views read `ComponentNode.props`. They do not import `ComponentContext`, `DataContext` or `GenericBinder` from `@a2ui/web_core`; ESLint enforces this.
5. Agent data is untrusted. Never evaluate it, never pass it to `{@html}`, and never spread it onto an element. ESLint forbids `eval`, `new Function` and `{@html}`.
6. Comment only what the code cannot say: a hard-to-read block, or the reason behind a decision.

Every source file starts with the license header:

```ts
/*
 * Copyright 2026 The a2ui-svelte Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * ...
 */
```

Svelte files carry the same text in an HTML comment. Use the year the file is created, and do not update the year of files you did not otherwise change. `scripts/license-header.txt` and `scripts/license-header.svelte.txt` hold the full text.

## Commits and pull requests

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) with a scope, as in the official repository:

```text
feat(svelte): render basic catalog Markdown with a Svelte component
fix(svelte): keep the caret when a binding echoes the typed value
test(svelte): run the golden-transcript scenarios
docs: describe the reactivity bridge
```

Common scopes are `svelte` for the package and `explorer` for the explorer. The body says what changed and why, in plain sentences.

Keep each pull request to one change. Do not mix a feature with a refactoring, and do not reformat lines you did not change. The description states the problem, the change, and how you verified it.

## Changelog

A change to the package's public API or to behavior a consumer can observe adds an entry under `## Unreleased` in `typescript/renderers/svelte/CHANGELOG.md`:

1. Say in one or two sentences what changed and what callers do about it.
2. Put `**BREAKING CHANGE**:` entries first, each with a migration note.
3. End the entry with a link to the pull request.
4. Leave out internal changes, test-only changes and changes to the explorer.

## Where these conventions come from

Each convention above was taken from the official repository at commit [`1dbe86a94257`](https://github.com/a2ui-project/a2ui/tree/1dbe86a942579cc83a1d657213f0db3b881632ae) (2026-11-24):

1. Commit messages: the repository's history, for example `fix(rpc): enforce agent caller boundary on nested callRendererFunction arguments (#4336)` and `feat(core): let a MessageProcessor take a catalog after it is built (#3304)`. Upstream subjects end with the pull request number, which the squash merge adds; commits made before this repository had pull requests have none.
2. Pull request scope and comments: `.agents/skills/pr-hygiene/SKILL.md`.
3. Changelog entries: `.agents/skills/update-changelog/SKILL.md`, and `typescript/renderers/react/CHANGELOG.md` for examples.
4. Documentation wording and version labels: `.agents/skills/natural-writing/SKILL.md` and section 2 of `AGENTS.md`.
5. Code style and formatting: `CONTRIBUTING.md` (Google TypeScript Style Guide), `.prettierrc`, and `eslint.preset.mjs` (`gts`).
6. License header: the header of every file under `typescript/renderers/react/src/`, with this project's copyright line.
7. Package layout, file names and public names: `typescript/renderers/react/src/` and `typescript/renderers/react/package.json`.
8. Public API doc comments: the JSDoc in `typescript/renderers/react/src/` and `typescript/core/web_core/src/universal/`.
9. Conformance harness: `typescript/renderers/react/tests/adapter_harness.tsx`, `adapter_conformance.test.tsx` and `e2e_scenarios.test.tsx`, and `conformance/conformance_harness_implementation_guide.md`.
10. Design and codebase records: `blueprints/modules/a2ui_framework_adapter.blueprint.md` and `blueprints/codebases/typescript/renderers/react/codebase.blueprint.md`.
11. Explorer: `typescript/renderers/react/a2ui_explorer/` and section 9 (Gallery App) of the framework adapter blueprint.
12. Package README content: `docs/site/src/content/docs/guides/client-integration.mdx`.

When the official repository changes one of these, update this list along with the convention.

## Reporting security issues

See [SECURITY.md](SECURITY.md). Do not open a public issue for a vulnerability.
