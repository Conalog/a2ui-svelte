# Changelog

## Unreleased

- Add `A2uiSurface`, which renders an A2UI surface from a `@a2ui/web_core` `SurfaceModel`. The basic catalog renders through the universal custom elements of `@a2ui/web_core`, so v1.0, v0.9 and v0.9.1 surfaces render through one code path.
- Add `createComponentImplementation` and the `SvelteA2uiComponentProps`, `SvelteComponentImplementation`, `SvelteCatalogComponent`, `NodeBuildChild` and `NodeChild` types, which register Svelte components in a catalog next to the basic catalog. Svelte components and universal elements nest in either order, and a Svelte component inside a universal container reads the application's Svelte context.
- Add `fromSignal` and `getA2uiSurface` for components that read `@a2ui/web_core` signals or the enclosing surface.
- Add `setMarkdownContext` and `getMarkdownContext`. `A2uiSurface` hands the renderer to the basic catalog's `Text`.
