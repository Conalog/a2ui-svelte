# Changelog

## Unreleased

## 0.1.0

- Require `@a2ui/web_core` `^0.16.1`, `svelte` `^5.50.3` and `zod` `^3.25.76` as peer dependencies. Svelte 5.50.3 is the first release that passes `$effect` errors to `<svelte:boundary>`, which the renderer relies on to forward errors from Svelte components inside basic catalog containers.
- Add `A2uiSurface`, which renders an A2UI surface from a `@a2ui/web_core` `SurfaceModel`. The basic catalog renders through the universal custom elements of `@a2ui/web_core`, so v1.0, v0.9 and v0.9.1 surfaces render through one code path.
- Add `createComponentImplementation` and the `SvelteA2uiComponentProps`, `SvelteComponentImplementation`, `SvelteCatalogComponent`, `NodeBuildChild` and `NodeChild` types, which register Svelte components in a catalog next to the basic catalog. Svelte components and universal elements nest in either order, and a Svelte component inside a universal container reads the application's Svelte context and reaches its error boundaries. `buildChild` takes the child tokens from `props`, a raw component id, or an `{id, basePath}` reference.
- Add `fromSignal` and `getA2uiSurface` for components that read `@a2ui/web_core` signals or the enclosing surface.
- Add `setMarkdownContext` and `getMarkdownContext`. `A2uiSurface` hands the renderer to the basic catalog's `Text`.
- Add `setMarkdownComponentContext`, `getMarkdownComponentContext` and `MarkdownComponentProps`. `A2uiSurface` renders the Markdown of the basic catalog's `Text` through the Svelte component the context holds, inside the application's Svelte tree, so the component reads the application's context. It takes precedence over `setMarkdownContext`.
