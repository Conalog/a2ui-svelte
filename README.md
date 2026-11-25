# a2ui-svelte

A Svelte 5 renderer for [A2UI](https://a2ui.org) (Agent-to-User Interface), built on the official TypeScript core [`@a2ui/web_core`](https://www.npmjs.com/package/@a2ui/web_core).

| Package                                                      | Description                                        |
| ------------------------------------------------------------ | -------------------------------------------------- |
| [`@conalog/a2ui-svelte`](typescript/renderers/svelte)        | The renderer: `A2uiSurface` and the catalog API.   |
| [`a2ui_explorer`](typescript/renderers/svelte/a2ui_explorer) | A SvelteKit gallery and live agent demo (private). |

Protocol versions: v1.0 (Current), v0.9.1 and v0.9. v0.8 is not supported.

## Status

The package is published on npm as [`@conalog/a2ui-svelte`](https://www.npmjs.com/package/@conalog/a2ui-svelte). It is at 0.x, like `@a2ui/web_core`, so a minor release may change its API. It follows the official [framework adapter blueprint](https://github.com/a2ui-project/a2ui/blob/main/blueprints/modules/a2ui_framework_adapter.blueprint.md) and passes the official renderer conformance suites:

| Suite                                                 | Result                                       |
| ----------------------------------------------------- | -------------------------------------------- |
| `conformance/core/adapter_conformance.yaml`           | 21 of 22 pass, 1 skipped (see below)         |
| `conformance/adapter/adapter_conformance_v0_9.yaml`   | 16 of 16 pass                                |
| `conformance/core/accessibility.yaml`                 | 7 of 7 pass, with axe-core rules in Chromium |
| `conformance/e2e` (golden transcripts, renderer half) | 8 of 8 pass                                  |

The skipped case checks warning hints on the basic catalog `TextField`, which the shared basic catalog elements do not render yet; the official React and Lit renderers skip it for the same reason.

The suites run in jsdom and again in Chromium. See [docs/design.md](docs/design.md) for how the renderer works and why.

## Quick start

```sh
npm install @conalog/a2ui-svelte @a2ui/web_core zod
```

```svelte
<script lang="ts">
  import {basicCatalog, injectBasicCatalogStyles, MessageProcessor} from '@a2ui/web_core/v1_0';
  import {A2uiSurface, type SvelteCatalogComponent} from '@conalog/a2ui-svelte';

  injectBasicCatalogStyles();

  const processor = new MessageProcessor<SvelteCatalogComponent>([basicCatalog]);
  processor.processMessages([
    {
      version: '1.0',
      createSurface: {
        surfaceId: 'hello',
        catalogId: basicCatalog.id,
        components: [{id: 'root', component: 'Text', text: 'Hello from an agent'}],
      },
    },
  ]);
  const surface = processor.model.getSurface('hello')!;
</script>

<A2uiSurface {surface} />
```

The [package README](typescript/renderers/svelte/README.md) covers custom components, theming, Markdown, transports and security.

## Repository layout

The repository mirrors the paths of [a2ui-project/a2ui](https://github.com/a2ui-project/a2ui), so the package can move there as `typescript/renderers/svelte` without changes.

```text
typescript/renderers/svelte/                 # the package
typescript/renderers/svelte/a2ui_explorer/   # the SvelteKit explorer
conformance/, catalogs/basic/                # copied from the official repository
blueprints/                                  # the codebase blueprint
docs/design.md                               # design and decisions
scripts/                                     # repository scripts
```

The files under `conformance/` and `catalogs/` are copied unchanged from the official repository at a pinned commit; [conformance/VENDORED.md](conformance/VENDORED.md) names it.

## Run the explorer

The explorer is a SvelteKit 3 app and needs Node.js 22.17 or later.

```sh
corepack yarn install
corepack yarn workspace @conalog/a2ui-svelte build
corepack yarn workspace @conalog/a2ui-svelte-explorer dev
```

The gallery shows every official basic catalog example, lets you step through its messages, and shows the data model and the actions the surface sends. The live agent page talks to a scripted agent over JSON Lines.

## Differences from the official repository

The package stays within what the official renderers do. Where it differs, the package README lists each difference and its reason under [Differences from the official renderers](typescript/renderers/svelte/README.md#differences-from-the-official-renderers).

The explorer follows the official explorers (a gallery of the official examples with a message stepper, the data model and an event log), with three additions that the official explorers do not have:

1. A live agent page that reads a scripted agent over JSON Lines from a SvelteKit endpoint and posts actions back, as an example of a transport in SvelteKit.
2. Svelte versions of the `CustomGrid` and `CustomSlider` components the official `native-grid` example asks for, and one more example with a Svelte `StatusBadge` on v1.0.
3. A script Content Security Policy without `'unsafe-eval'`, so the end-to-end tests check that the renderer runs under one.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache-2.0. See [LICENSE](LICENSE). The files copied from the official A2UI repository keep their own license headers.
