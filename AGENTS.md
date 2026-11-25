# Guide for coding agents

This repository holds the Svelte 5 renderer for A2UI, `@conalog/a2ui-svelte`, built on the official `@a2ui/web_core`. Read [docs/design.md](docs/design.md) before changing how the renderer works, and [CONTRIBUTING.md](CONTRIBUTING.md) for the checks and conventions.

## Rules

1. Follow the official A2UI repository: its [AGENTS.md](https://github.com/a2ui-project/a2ui/blob/main/AGENTS.md), the [framework adapter blueprint](https://github.com/a2ui-project/a2ui/blob/main/blueprints/modules/a2ui_framework_adapter.blueprint.md), and the layout and names of the official React renderer. The package must be able to move to `typescript/renderers/svelte` in that repository unchanged.
2. Stay within what the official repository does. Add a difference only when it is worth its cost, and list every user-visible difference, with its reason, under "Differences from the official renderers" in the package README (the explorer's under "Differences from the official repository" in the root README).
3. Do not edit `conformance/` or `catalogs/`; they are copies. Update them with `node scripts/sync-official.mjs`.
4. Do not reimplement what `@a2ui/web_core` owns: message processing, the data model, expressions, functions, checks, node resolution, or the basic catalog elements.
5. Treat agent data as untrusted: no evaluation, no `{@html}`, no spreading onto elements.
6. Every source file carries the license header (`scripts/license-header.txt`).
7. Commit messages use Conventional Commits with a scope (`feat(svelte): ...`). Public API changes add a `## Unreleased` entry to `typescript/renderers/svelte/CHANGELOG.md`.
8. Write documentation in plain, direct English: numbered lists and no filler words. The package README keeps the headings of the official React README; other documents use sentence-case headings.

## Commands

From `typescript/renderers/svelte`: `yarn typecheck`, `yarn test:unit`, `yarn test:ssr`, `yarn test:browser`, `yarn lint`, `yarn format`, `yarn lint:package`. From `typescript/renderers/svelte/a2ui_explorer`: `yarn typecheck`, `yarn test:e2e`. Run Yarn through Corepack (`corepack yarn ...`) if `yarn` is not on the path.
