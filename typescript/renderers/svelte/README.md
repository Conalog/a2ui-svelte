# @conalog/a2ui-svelte

Svelte 5 renderer for [A2UI](https://a2ui.org), built on the official [`@a2ui/web_core`](https://www.npmjs.com/package/@a2ui/web_core).

An agent describes a user interface as A2UI messages: components, their properties, and a data model. `@a2ui/web_core` processes the messages, and `A2uiSurface` renders the result with Svelte. The basic catalog (Text, Button, TextField, List, Tabs, Modal and the rest) renders through the custom elements that `@a2ui/web_core` shares with the official React, Lit and Angular renderers. Your own components are ordinary Svelte components that you register next to it.

The renderer supports protocol v1.0, and renders v0.9 and v0.9.1 surfaces through the same code. It passes the official adapter, accessibility and golden-transcript conformance suites.

## Install

```sh
npm install @conalog/a2ui-svelte @a2ui/web_core zod
```

`@a2ui/web_core` (`^0.16.1`), `svelte` (`^5.29.0`) and `zod` (`^3.25.76`) are peer dependencies, so your application holds one copy of each. The package imports nothing from `$app/*`, so it works in plain Vite projects as well as in SvelteKit.

## Render a surface

Create a `MessageProcessor` with the catalogs your application supports, feed it the agent's messages, and render each surface it creates:

```svelte
<script lang="ts">
  import {
    type ActionPayload,
    basicCatalog,
    injectBasicCatalogStyles,
    MessageProcessor,
    type SurfaceModel,
  } from '@a2ui/web_core/v1_0';
  import {A2uiSurface, type SvelteCatalogComponent} from '@conalog/a2ui-svelte';

  injectBasicCatalogStyles();

  let surfaces = $state.raw<SurfaceModel<SvelteCatalogComponent>[]>([]);

  const processor = new MessageProcessor<SvelteCatalogComponent>([basicCatalog], action =>
    sendToAgent(action),
  );
  processor.model.onSurfaceCreated.subscribe(surface => {
    surfaces = [...surfaces, surface];
  });
  processor.model.onSurfaceDeleted.subscribe(id => {
    surfaces = surfaces.filter(surface => surface.id !== id);
  });

  function sendToAgent(action: ActionPayload) {
    // Post {version: '1.0', action} to your agent; see "Connect a transport".
  }
</script>

{#each surfaces as surface (surface.id)}
  <A2uiSurface {surface} />
{/each}
```

`A2uiSurface` renders nothing during server-side rendering and fills in on the client. A component that has not arrived yet, has a type no catalog knows, or repeats one of its ancestors renders nothing and takes no space; the surface reports the last two through `surface.onError`.

## Register your own components

Write a Svelte component that takes `SvelteA2uiComponentProps`, and pair it with the component's API (its name and Zod schema):

```svelte
<!-- StatusBadge.svelte -->
<script lang="ts">
  import type {SvelteA2uiComponentProps} from '@conalog/a2ui-svelte';

  let {props}: SvelteA2uiComponentProps<{label?: string; tone?: 'neutral' | 'positive'}> = $props();
</script>

<span class="badge" data-tone={props.tone ?? 'neutral'}>{props.label}</span>
```

```ts
import {z} from 'zod';
import {basicCatalog, Catalog, CommonSchemas} from '@a2ui/web_core/v1_0';
import {createComponentImplementation, type SvelteCatalogComponent} from '@conalog/a2ui-svelte';
import StatusBadge from './StatusBadge.svelte';

const StatusBadgeApi = {
  name: 'StatusBadge',
  schema: z.object({
    label: CommonSchemas.DynamicString,
    tone: z.enum(['neutral', 'positive']).optional(),
  }),
};

export const appCatalog = new Catalog<SvelteCatalogComponent>(
  'https://example.com/catalogs/app.json',
  '1.0',
  [...basicCatalog.components.values(), createComponentImplementation(StatusBadgeApi, StatusBadge)],
  [...basicCatalog.functions.values()],
);
```

The component's `props` are typed from the schema. Values bound to the data model arrive resolved and update when the data changes. The component receives:

| Prop                  | What it is                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `props`               | The resolved properties. Each writable value has a `set<Name>` setter, each action is a function, each child is a token. |
| `buildChild`          | A snippet that renders a child token: `{@render buildChild(props.child)}`.                                               |
| `node`                | The resolved `ComponentNode`, for advanced use.                                                                          |
| `metadata`            | The component's `metadata` envelope. Reading it subscribes to it.                                                        |
| `accessibilityRef`    | An attachment for the element that carries the label, description and validation state.                                  |
| `validationErrorsRef` | An attachment for the element that shows validation messages.                                                            |

A container renders its children through `buildChild`, keyed by the token:

```svelte
{#each props.children ?? [] as child (child)}
  {@render buildChild(child)}
{/each}
```

A form control writes through the setter and calls actions straight from the event handler, so functions that need a user gesture (such as `openUrl`) see it:

```svelte
<input
  value={props.value ?? ''}
  oninput={e => props.setValue(e.currentTarget.value)}
  {@attach accessibilityRef}
/>
<button onclick={() => props.action?.()}>{props.label}</button>
```

Svelte components and basic catalog elements nest in either order. A Svelte component inside a basic catalog `Column` still reads your application's Svelte context.

Only a component whose data changed re-renders. Typing into an input keeps its element, focus and caret while each keystroke goes through the data model and back.

## Theme the surface

The renderer reads no theme from the agent. The basic catalog elements style themselves with `--a2ui-*` CSS custom properties, which your page sets:

```css
.chat {
  --a2ui-color-primary: #0f766e;
  --a2ui-color-on-primary: #ffffff;
  --a2ui-font-family-title: 'Inter', system-ui, sans-serif;
}
```

`injectBasicCatalogStyles()` adopts the default stylesheet with the documented defaults. Your own components use your own styles.

## Markdown

The basic catalog `Text` shows Markdown as plain, escaped text until you give it a renderer. Set one above the surfaces, for example `renderMarkdown` from [`@a2ui/markdown-it`](https://www.npmjs.com/package/@a2ui/markdown-it), which sanitizes its output:

```svelte
<script lang="ts">
  import {renderMarkdown} from '@a2ui/markdown-it';
  import {setMarkdownContext} from '@conalog/a2ui-svelte';

  setMarkdownContext(renderMarkdown);
</script>
```

To render Markdown with a Svelte component of your own instead, call `setMarkdownComponentContext(MyMarkdown)`. The component receives the Markdown source as `markdown` and renders inside your application's tree.

## Connect a transport

A2UI does not prescribe a transport, and this package contains no transport code. Read messages from wherever your agent sends them and pass them to the processor. For JSON Lines over `fetch`:

```ts
async function readAgent(response: Response) {
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffered = '';
  for (;;) {
    const {done, value} = await reader.read();
    buffered += value ?? '';
    const lines = buffered.split('\n');
    buffered = done ? '' : lines.pop()!;
    for (const line of lines) {
      if (line.trim()) await processor.processMessagesAsync([JSON.parse(line)]);
    }
    if (done) break;
  }
}
```

For Server-Sent Events, parse each event's data the same way:

```ts
const events = new EventSource('/agent/stream');
events.onmessage = event => void processor.processMessagesAsync([JSON.parse(event.data)]);
```

Send actions back with the fields the protocol defines, leaving out renderer-local ones:

```ts
function toActionMessage(action: ActionPayload) {
  const {name, surfaceId, sourceComponentId, timestamp, context} = action;
  return {version: '1.0', action: {name, surfaceId, sourceComponentId, timestamp, context}};
}
```

Over MCP, read the `a2ui://` resource with your MCP client and pass its messages on in the same way.

## Security

Treat every agent message as untrusted. The renderer is built so that it does not need trust:

1. Only components registered in the surface's catalogs render.
2. Nothing the agent sends is evaluated as code, and the renderer never writes agent data into HTML or attributes. It runs under a script Content Security Policy without `'unsafe-eval'`.
3. Media URLs are limited to `http:`, `https:` and `data:`, and `openUrl` to `http:`, `https:`, `mailto:` and `tel:`, by `@a2ui/web_core`. Pass URLs your own components render through `sanitizeMediaUrl` from `@a2ui/web_core`.

Your own components decide what to do with the values they receive. Do not pass agent data to `{@html}`, and do not spread it onto elements. If a component must forward agent-provided attributes, filter them first:

```ts
const allowed = Object.fromEntries(
  Object.entries(props.attributes ?? {}).filter(
    ([name, value]) => !/^on/i.test(name) && typeof value === 'string',
  ),
);
```

## Reading web_core signals

`fromSignal(signal).current` reads any `@a2ui/web_core` signal and subscribes while a template, `$derived` or `$effect` reads it. `getA2uiSurface()` returns the enclosing surface, for example to read `surface.metadataSignal`.

## Supported versions

| Dependency       | Range                   |
| ---------------- | ----------------------- |
| A2UI protocol    | v1.0, v0.9 and v0.9.1   |
| `@a2ui/web_core` | `^0.16.1`               |
| `svelte`         | `^5.29.0`               |
| SvelteKit        | optional; tested with 3 |

v0.8 is not supported.

## License

Apache-2.0. See [LICENSE](LICENSE).
