---
codebase_path: typescript/renderers/svelte
associated_module: a2ui_framework_adapter
module_blueprint_commit: 1dbe86a942579cc83a1d657213f0db3b881632ae
implemented_features:
  node_resolution: 1dbe86a942579cc83a1d657213f0db3b881632ae
  universal_custom_elements: 1dbe86a942579cc83a1d657213f0db3b881632ae
local_development:
  test_command: 'yarn test'
  lint_command: 'yarn lint'
  format_command: 'yarn format'
---

# **Svelte Framework Adapter Codebase Blueprint**

## **Architecture & Ecosystem Map**

The Svelte 5 renderer (`@conalog/a2ui-svelte`) for the A2UI ecosystem, built on the node resolution and universal custom elements layers of `@a2ui/web_core`.

- **Surface & Node Resolution (`A2uiSurface`, `NodeResolver`)**: `A2uiSurface` creates a `NodeResolver` for the target `SurfaceModel` in a client-side `$effect`, tracks `resolver.rootNode`, and renders the resolved `ComponentNode` tree through `ChildElement`. A new `surface` prop disposes the old resolver and remounts the tree.
- **Reactivity Bridge (`fromSignal`)**: `fromSignal` wraps a web_core signal with `createSubscriber` from `svelte/reactivity`, so a view subscribes on first read in a reactive context and unsubscribes when nothing reads it any more.
- **Node View & Property Binding (`NodeContent`, `toViewProps`)**: `NodeContent` subscribes to one node's `props`, unwraps each `ResolvedBinding` into a value and a `set<Prop>` setter, replaces child nodes with `instanceId` tokens, and renders the implementation's component with `buildChild` as a snippet.
- **Universal Custom Elements (`SvelteWcHost`, `toWebComponent`, `prepareCatalogs`)**: Svelte catalog entries are wrapped as `a2ui-svelte-<name>` host elements before the resolver exists, covering `defaultCatalog` and `availableCatalogs`, so universal containers render them by tag name.

## **Local Technical Decisions & Overrides**

- **Host content mounting instead of a portal registry (`src/host_registry.ts`, `src/catalog/svelte_host_element.svelte.ts`, `src/HostedContent.svelte`)**: `ChildElement` marks each element it renders with a `HostOwner` holding `getAllContexts()` and an error channel. A host created by a universal container mounts `HostedContent` into itself with a copy of the nearest owner's context, so ambient context passes through universal elements. `HostedContent` catches errors in its own `<svelte:boundary>` and hands them to the owner's `ChildElement`, which rethrows them in an effect, so the application's error boundaries pass through universal elements as the blueprint requires. This needs Svelte 5.50.3, the first release that passes `$effect` errors to boundaries.
- **Child tokens are `instanceId` (`src/node-view.svelte.ts`)**: Svelte keys lists at the `{#each}` block, so the token an implementation keys by must survive core replacing the node object. `instanceId` is unique among one parent's children and stays the same through placeholder replacement and explicit-list reorders. A type change still remounts, because the tag name changes.
- **Host accessibility (`src/catalog/host_accessibility.ts`)**: `SvelteWcHost` calls `bindHostAccessibility` while connected. Implementations pass the `accessibilityRef` and `validationErrorsRef` attachments to the elements that carry the label and the validation messages.
- **Markdown component (`src/markdown_hosts.ts`)**: For `setMarkdownComponentContext`, `A2uiSurface` registers a web_core Markdown renderer that returns an `<a2ui-svelte-markdown>` element holding the Markdown in an escaped attribute; the element mounts the component with the owner's context.
- **No fallbacks (not conformant: Custom Fallbacks)**: Fallback builders (module blueprint §4.4) wait for `renderA2uiNode` in web_core to accept them, so every rendering path can honor them, as in the React renderer. Until then the adapter test area "Custom Fallbacks" is not met; unresolved nodes render nothing, which meets "Fallback States".
- **Bundling**: `@sveltejs/package` emits Svelte components and ES modules with type declarations; `publint --strict` checks the result.

## **Validation & Execution Recipes**

- **Test execution**: Run `yarn test` for `svelte-check`, the jsdom suites (including `conformance/core/adapter_conformance.yaml`, `conformance/core/accessibility.yaml`, `conformance/adapter/adapter_conformance_v0_9.yaml` and `conformance/e2e`), the Node server-rendering suite, and the Chromium suite.
- **Styles check**: Ensure code standards compliance with `yarn lint`.
- **Formatting**: Auto-format files with `yarn format`.
