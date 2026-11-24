# How to contribute

Thank you for helping with the Svelte renderer for A2UI. This guide covers the development setup, the checks a change must pass, and the conventions the repository follows. The conventions are the ones of the official [A2UI repository](https://github.com/a2ui-project/a2ui), so that the package can move there unchanged.

## Development setup

You need Node.js 20.19 or later (CI uses 22 and 24) and Corepack, which ships with Node.js. The repository uses Yarn 4 workspaces.

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

## Reporting security issues

See [SECURITY.md](SECURITY.md). Do not open a public issue for a vulnerability.
