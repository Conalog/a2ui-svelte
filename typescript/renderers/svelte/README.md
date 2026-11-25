# @conalog/a2ui-svelte

Svelte renderer for A2UI (Agent-to-User Interface): it renders the user interfaces that AI agents describe in A2UI messages, on top of the official [`@a2ui/web_core`](https://www.npmjs.com/package/@a2ui/web_core).

> [!NOTE]
> This is a community package, not an official A2UI package, and the A2UI team does not maintain it. It follows the official React and Lit renderers; [Differences from the official renderers](#differences-from-the-official-renderers) lists every place where it does not.

## Features

- Renders A2UI v0.9, v0.9.1 and v1.0 surfaces from the same package.
- Each component subscribes to its own resolved node, so a data change re-renders only the components that read it.
- Infers property types from the Zod schemas of your component APIs.
- Registers your own Svelte components next to the basic catalog.
- Renders any number of independent surfaces.

## Installation

```bash
npm install @conalog/a2ui-svelte @a2ui/web_core zod
```

`@a2ui/web_core` (`^0.16.1`), `svelte` (`^5.50.3`) and `zod` (`^3.25.76`) are peer dependencies.

## Protocol Versioning

Import the renderer from the package root (`@conalog/a2ui-svelte`) and the `MessageProcessor` from `@a2ui/web_core`. The renderer draws v0.9, v0.9.1 and v1.0 surfaces through the same code.

Only version-specific pieces, such as the basic catalog and its schemas, are imported from a versioned path:

```typescript
import {MessageProcessor} from '@a2ui/web_core';
import {A2uiSurface} from '@conalog/a2ui-svelte';

// Basic catalog for v1.0:
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
// ...or for v0.9 and v0.9.1:
// import {basicCatalog} from '@a2ui/web_core/v0_9/basic_catalog';
```

v0.8 is not supported.

## Quick Start

The Svelte renderer works alongside the `MessageProcessor` from `@a2ui/web_core`. The processor interprets JSON messages from an AI agent and manages the resulting UI state. The core concepts are:

- **Processor**: receives and interprets the agent's messages.
- **Surface**: an independent rendering area, identified by a string ID, that the agent creates and fills with components.
- **Catalog**: the set of components (for example `Text`, `Column`, `Button`) a surface can use.

The example below creates a processor with the `basicCatalog` from `@a2ui/web_core/catalogs/basic/v1`, feeds it a sequence of hardcoded messages, and renders the resulting surface.

```svelte
<script lang="ts">
  import {MessageProcessor, type ProcessableMessage} from '@a2ui/web_core';
  import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
  import {A2uiSurface, type SvelteCatalogComponent} from '@conalog/a2ui-svelte';

  // In a real app, these messages would come from an agent via WebSocket, SSE, etc.
  // Here we hardcode them to show the message format.
  const sampleAgentMessages: ProcessableMessage[] = [
    {version: '1.0', createSurface: {surfaceId: 'main-chat', catalogId: basicCatalog.id}},
    {
      version: '1.0',
      updateComponents: {
        surfaceId: 'main-chat',
        components: [
          {id: 'root', component: 'Column', children: ['greeting', 'description']},
          {id: 'greeting', component: 'Text', text: {'@path': '/title'}},
          {id: 'description', component: 'Text', text: {'@path': '/body'}},
        ],
      },
    },
    {
      version: '1.0',
      updateDataModel: {
        surfaceId: 'main-chat',
        path: '/',
        value: {
          title: 'Hello from A2UI!',
          body: 'Replace these messages with real agent responses to build interactive UIs.',
        },
      },
    },
  ];

  // 1. Create the processor and feed it messages.
  const processor = new MessageProcessor<SvelteCatalogComponent>([basicCatalog]);
  processor.processMessages(sampleAgentMessages);

  // 2. Keep the list of surfaces up to date as messages arrive.
  let surfaces = $state.raw([...processor.model.surfacesMap.values()]);
  $effect(() => {
    const sync = () => (surfaces = [...processor.model.surfacesMap.values()]);
    const created = processor.onSurfaceCreated(sync);
    const deleted = processor.onSurfaceDeleted(sync);
    return () => {
      created.unsubscribe();
      deleted.unsubscribe();
    };
  });
</script>

<!-- 3. Render every surface the agent has created. -->
<div class="a2ui-container">
  {#if surfaces.length === 0}
    <div>Waiting for agent...</div>
  {/if}
  {#each surfaces as surface (surface.id)}
    <A2uiSurface {surface} />
  {/each}
</div>
```

Running this example should display "Hello from A2UI!". The example uses three message types:

- [`createSurface`](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md#createsurface) initializes the rendering surface.
- [`updateComponents`](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md#updatecomponents) defines the UI tree: a `Column` containing two `Text` components.
- [`updateDataModel`](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md#updatedatamodel) provides the data the components reference through `@path` bindings; `{'@path': '/title'}` resolves to the `title` field of the data model.

`A2uiSurface` renders nothing during server-side rendering and fills in on the client. For connecting a real agent, and for sending actions and errors back to it, follow the official [client integration guide](https://a2ui.org/guides/client-integration/); the Lit tab there applies to Svelte as well.

## Defining Custom Components

### 1. Define the Component API

Describe the component's properties with a Zod schema, using the common types from `@a2ui/web_core`:

```typescript
import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v1_0';

export const StatusBadgeApi = {
  name: 'StatusBadge',
  schema: z.object({
    label: CommonSchemas.DynamicString,
    tone: z.enum(['neutral', 'positive']).optional(),
  }),
};
```

### 2. Create the Svelte Implementation

Write a Svelte component that takes `SvelteA2uiComponentProps`, and pair it with the API:

```svelte
<!-- StatusBadge.svelte -->
<script lang="ts">
  import type {SvelteA2uiComponentProps} from '@conalog/a2ui-svelte';

  let {props}: SvelteA2uiComponentProps<{label?: string; tone?: 'neutral' | 'positive'}> = $props();
</script>

<span class="badge" data-tone={props.tone ?? 'neutral'}>{props.label}</span>
```

```typescript
import {createComponentImplementation} from '@conalog/a2ui-svelte';
import StatusBadge from './StatusBadge.svelte';

export const StatusBadgeImpl = createComponentImplementation(StatusBadgeApi, StatusBadge);
```

The component's `props` are typed from the schema. Values bound to the data model arrive resolved and update when the data changes. The component receives:

| Prop                  | What it is                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `props`               | The resolved properties. Each writable value has a `set<Name>` setter, each action is a function, each child is a token. |
| `buildChild`          | A snippet that renders a child: `{@render buildChild(props.child)}`.                                                     |
| `node`                | The resolved `ComponentNode`.                                                                                            |
| `metadata`            | The component's `metadata` envelope. Reading it subscribes to it.                                                        |
| `accessibilityRef`    | An attachment for the element that carries the label, description and validation state.                                  |
| `validationErrorsRef` | An attachment for the element that shows validation messages.                                                            |

A container renders its children through `buildChild`, keyed by the token:

```svelte
{#each props.children ?? [] as child (child)}
  {@render buildChild(child)}
{/each}
```

`buildChild` also takes a raw component id or an `{id, basePath}` reference. A form control writes through the setter and calls actions straight from the event handler, so functions that need a user gesture (such as `openUrl`) see it:

```svelte
<input value={props.value ?? ''} oninput={e => props.setValue(e.currentTarget.value)} />
<button onclick={() => props.action?.()}>{props.label}</button>
```

Svelte components and basic catalog elements nest in either order. A Svelte component inside a basic catalog `Column` reads your application's Svelte context, and a `<svelte:boundary>` around `A2uiSurface` catches its errors.

To read other `@a2ui/web_core` state, `fromSignal(signal).current` reads any signal and subscribes while a template, `$derived` or `$effect` reads it, and `getA2uiSurface()` returns the enclosing surface, for example to read `surface.metadataSignal`.

### 3. Accessibility

The host element of each Svelte component applies the protocol's accessibility attributes, so a component gets them without code of its own: `aria-live`, `aria-hidden` and `inert` on the host, and `aria-label` and `aria-description` on the host with `role="group"`. To put the label and description on an inner element instead, attach `accessibilityRef` to it. That element also gets `aria-invalid="true"` while a check fails. Attach `validationErrorsRef` to the element that shows the validation messages, and the `accessibilityRef` element gets `aria-describedby` pointing at it:

```svelte
<input value={props.value ?? ''} {@attach accessibilityRef} />
{#if props.validationErrors?.length}
  <p {@attach validationErrorsRef}>{props.validationErrors.join(' ')}</p>
{/if}
```

## Defining Catalogs and Functions

Group your components and logic functions into a `Catalog` to be used by the `MessageProcessor`:

```typescript
import {Catalog, createFunctionImplementation} from '@a2ui/web_core';
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
import type {SvelteCatalogComponent} from '@conalog/a2ui-svelte';
import {z} from 'zod';

// 1. Implement a custom logic function
const isAdmin = createFunctionImplementation(
  {name: 'is_admin', returnType: 'boolean', schema: z.object({role: z.string()})},
  args => args.role === 'admin',
);

// 2. Compose the catalog
export const myCatalog = new Catalog<SvelteCatalogComponent>(
  'https://example.com/catalogs/v1.json',
  '1.0', // Protocol version the catalog targets
  [...basicCatalog.components.values(), StatusBadgeImpl],
  [...basicCatalog.functions.values(), isAdmin],
);
```

## Basic Catalog Components

`@a2ui/web_core/catalogs/basic/v1` (v1.0) and `@a2ui/web_core/v0_9/basic_catalog` (v0.9 and v0.9.1) each provide a `basicCatalog` with the same standard components. They are W3C Custom Elements, shared with the official renderers, and the Svelte renderer renders them as elements:

- Layout: `Row`, `Column`, `List`, `Card`, `Tabs`, `Modal`, `Divider`
- Content: `Text`, `Image`, `Icon`, `Video`, `AudioPlayer`
- Input: `Button`, `TextField`, `CheckBox`, `ChoicePicker`, `Slider`, `DateTimeInput`

### Markdown in `Text`

`Text` renders its Markdown with a renderer the app provides. Call `setMarkdownContext` with a function that returns HTML, such as `renderMarkdown` from `@a2ui/markdown-it`, or call `setMarkdownComponentContext` with a Svelte component, above the surfaces:

```svelte
<script lang="ts">
  import {setMarkdownComponentContext} from '@conalog/a2ui-svelte';
  import ChatMarkdown from './ChatMarkdown.svelte'; // receives {markdown}

  setMarkdownComponentContext(ChatMarkdown);
</script>
```

The component renders inside each `Text`, as part of the app's Svelte tree, so it reads the app's context. When both are set, the component is used. `Text` reads one Markdown renderer for the whole page, so set the component above every `A2uiSurface` on the page or above none. Without a renderer, `Text` shows its Markdown as plain text.

## Styling

The basic catalog components are self-contained and styled with the CSS custom properties `@a2ui/web_core` documents. `injectBasicCatalogStyles()` from `@a2ui/web_core/catalogs/basic/v1` adopts the default stylesheet; override the `--a2ui-*` properties on `:root` or on a container to match your application:

```css
.chat {
  --a2ui-color-primary: #0f766e;
  --a2ui-color-on-primary: #ffffff;
}
```

Your own Svelte components use Svelte's scoped styles. Use `:global(...)` to reach elements a component does not render itself, such as those generated by Markdown.

## Differences from the official renderers

The package follows the official React and Lit renderers and the official framework adapter blueprint. Where it differs, it differs for the reason given:

1. **Package.** It is published as `@conalog/a2ui-svelte`, by the a2ui-svelte authors, not by the A2UI team. The repository mirrors the official layout so that it could move upstream as `@a2ui/svelte`.
2. **Svelte forms of the React APIs.** React hooks and contexts become Svelte functions and snippets: `useA2uiSurface` is `getA2uiSurface`, `useSignalValue(signal)` is `fromSignal(signal).current`, `MarkdownContext` and `MarkdownComponentContext` are `setMarkdownContext` and `setMarkdownComponentContext`, `buildChild` is a snippet, and `accessibilityRef` and `validationErrorsRef` are attachments.
3. **No legacy entry points.** `createBinderlessComponentImplementation`, `useNodeView`, the deprecated `render` and `context` paths, and the `./v0_8`, `./v0_9` and `./styles` entry points are not provided. They exist in React for applications written before the node API; this package has no such applications. v0.8 is not supported.
4. **Child tokens are `instanceId`.** The tokens in `props` that name children are each child node's `instanceId`; React uses `node.id`. Svelte keys a list at the `{#each}` block, and `instanceId` stays the same when the node object behind it is replaced (a pending component arriving, a reordered list), which is what the blueprint asks views to key by.
5. **Peer dependency on `@a2ui/web_core`.** React lists `@a2ui/web_core` as a dependency. Here it is a peer dependency, because the application imports it too, and a second copy on a page breaks custom element registration and `instanceof` checks.
6. **Svelte components inside basic catalog containers are mounted, not portaled.** React portals such a component from the nearest React element; here the component's host mounts it as a separate Svelte root with that element's context, and passes its errors back to that element. Context and error boundaries behave as they do in React.
7. **Svelte 5.50.3 or later.** It is the first Svelte release that passes `$effect` errors to `<svelte:boundary>`, which difference 6 relies on.

Like the official renderers, the package does not implement fallback builders for pending and failed components yet; unresolved components render nothing. They follow when `@a2ui/web_core` supports them in every rendering path ([a2ui-project/a2ui#2013](https://github.com/a2ui-project/a2ui/issues/2013)).

## Security

> [!IMPORTANT]
> The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent, including its messages and UI definitions, should be handled as untrusted input. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

**Developer Responsibility**: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures, such as input sanitization, Content Security Policies (CSP), and secure credential handling, to protect their systems and users.

## Development

See [CONTRIBUTING.md](https://github.com/Conalog/a2ui-svelte/blob/main/CONTRIBUTING.md) for the setup. From this directory:

```bash
yarn build       # Build the package
yarn typecheck   # svelte-check
yarn lint        # ESLint
```

## Testing

Uses [Vitest](https://vitest.dev/) with [Svelte Testing Library](https://testing-library.com/docs/svelte-testing-library/intro/) in jsdom, in plain Node for server-side rendering, and in Chromium through Vitest browser mode. The official adapter, accessibility and golden-transcript conformance suites run in jsdom and in Chromium.

```bash
yarn test           # Type check, then the jsdom, server-rendering and browser suites
yarn test:unit      # jsdom suites once
yarn test:watch     # jsdom suites in watch mode
```

## License

Apache-2.0. See [LICENSE](LICENSE).
