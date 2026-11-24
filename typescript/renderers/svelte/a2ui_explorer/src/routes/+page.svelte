<!--
 Copyright 2026 The a2ui-svelte Authors

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->

<!--
  The gallery: pick an example on the left, step through its messages in the
  middle, and watch the data model and the outbound events on the right.
-->
<script lang="ts">
  import {A2uiSurface} from '@conalog/a2ui-svelte';
  import {goto} from '$app/navigation';
  import {page} from '$app/state';

  import {EXAMPLES, findExample, type ProtocolVersion} from '$lib/examples.js';
  import {GallerySession} from '$lib/session.svelte.js';

  const VERSIONS: readonly ProtocolVersion[] = ['v1.0', 'v0.9'];
  /** The basic catalog's default `--a2ui-color-primary`, shown until the user picks one. */
  const DEFAULT_PRIMARY = '#1177ee';

  const version = $derived<ProtocolVersion>(
    page.url.searchParams.get('version') === 'v0.9' ? 'v0.9' : 'v1.0',
  );
  const example = $derived(findExample(version, page.url.searchParams.get('example')));

  let session = $state.raw<GallerySession>();
  let primaryColor = $state('');

  // A new session per example, so each starts from an empty processor. Picking
  // an example runs every message; Reset starts over one message at a time.
  $effect(() => {
    const next = new GallerySession(example);
    next.runAll();
    session = next;
    return () => {
      next.dispose();
      // A session Reset created since then.
      session?.dispose();
    };
  });

  function select(nextVersion: ProtocolVersion, id: string) {
    const params = new URLSearchParams({version: nextVersion, example: id});
    void goto(`?${params}`, {replaceState: true, noScroll: true, keepFocus: true});
  }

  function reset() {
    session?.dispose();
    const next = new GallerySession(example);
    session = next;
  }
</script>

<main class="gallery">
  <aside class="examples" aria-label="Examples">
    <div class="versions" role="radiogroup" aria-label="Protocol version">
      {#each VERSIONS as candidate (candidate)}
        <button
          type="button"
          role="radio"
          aria-checked={version === candidate}
          onclick={() => select(candidate, EXAMPLES[candidate][0]!.id)}
        >
          {candidate}
        </button>
      {/each}
    </div>
    <ul>
      {#each EXAMPLES[version] as item (item.id)}
        <li>
          <button
            type="button"
            class="example"
            aria-current={item.id === example.id ? 'true' : undefined}
            data-example={item.id}
            onclick={() => select(version, item.id)}
          >
            <span class="example-title">{item.title}</span>
            <span class="example-file">{item.id}.json</span>
          </button>
        </li>
      {/each}
    </ul>
  </aside>

  <section class="preview" aria-label="Preview">
    <div class="toolbar">
      <div>
        <h1>{example.title}</h1>
        <p>{example.description}</p>
      </div>
      <div class="controls">
        <button type="button" onclick={reset}>Reset</button>
        <button type="button" disabled={!session || session.done} onclick={() => session?.step()}>
          Step
        </button>
        <button type="button" disabled={!session || session.done} onclick={() => session?.runAll()}>
          Run all
        </button>
        <label class="color">
          Primary color
          <input
            type="color"
            value={primaryColor || DEFAULT_PRIMARY}
            oninput={event => (primaryColor = event.currentTarget.value)}
          />
        </label>
      </div>
    </div>
    <div
      class="surfaces"
      data-testid="surfaces"
      style:--a2ui-color-primary={primaryColor || undefined}
    >
      {#each session?.surfaces ?? [] as surface (surface.id)}
        <div class="surface" data-surface-id={surface.id}>
          <A2uiSurface {surface} />
        </div>
      {/each}
    </div>
  </section>

  <aside class="inspector" aria-label="Inspector">
    <section>
      <h2>Messages ({session?.processed ?? 0} / {example.messages.length})</h2>
      <ol class="messages">
        {#each example.messages as message, index (index)}
          <li class:processed={index < (session?.processed ?? 0)}>
            <pre>{JSON.stringify(message, null, 2)}</pre>
          </li>
        {/each}
      </ol>
    </section>
    <section>
      <h2>Data model</h2>
      {#each Object.entries(session?.dataModels ?? {}) as [surfaceId, json] (surfaceId)}
        <h3>{surfaceId}</h3>
        <pre data-testid="data-model">{json}</pre>
      {:else}
        <p class="empty">No surface yet.</p>
      {/each}
    </section>
    <section>
      <h2>Events</h2>
      <ol class="events" data-testid="events">
        {#each session?.events ?? [] as event (event.id)}
          <li data-kind={event.kind}>
            <span class="event-meta">{event.time} · {event.kind} · {event.surfaceId}</span>
            <pre>{JSON.stringify(event.payload, null, 2)}</pre>
          </li>
        {:else}
          <li class="empty">Actions and errors appear here.</li>
        {/each}
      </ol>
    </section>
  </aside>
</main>

<style>
  .gallery {
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr) 22rem;
    flex: 1;
    min-height: 0;
  }
  @media (max-width: 64rem) {
    .gallery {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .examples,
  .inspector {
    background: var(--explorer-panel);
    overflow: auto;
    max-height: calc(100vh - 3rem);
  }
  .examples {
    border-right: 1px solid var(--explorer-border);
  }
  .inspector {
    border-left: 1px solid var(--explorer-border);
    padding: 0 1rem 1rem;
  }
  .versions {
    display: flex;
    gap: 0.25rem;
    padding: 0.75rem;
  }
  .versions button {
    flex: 1;
    padding: 0.35rem;
    border: 1px solid var(--explorer-border);
    border-radius: 0.4rem;
    background: white;
    cursor: pointer;
  }
  .versions button[aria-checked='true'] {
    border-color: var(--explorer-accent);
    color: var(--explorer-accent);
    font-weight: 600;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0 0.5rem 1rem;
  }
  .example {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    width: 100%;
    padding: 0.5rem 0.6rem;
    border: 0;
    border-radius: 0.4rem;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .example:hover {
    background: #eef2f7;
  }
  .example[aria-current='true'] {
    background: white;
    box-shadow: inset 3px 0 0 var(--explorer-accent);
  }
  .example-title {
    font-weight: 600;
    font-size: 0.9rem;
  }
  .example-file {
    color: var(--explorer-muted);
    font-size: 0.75rem;
  }
  .preview {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--explorer-border);
  }
  h1 {
    margin: 0;
    font-size: 1.15rem;
  }
  .toolbar p {
    margin: 0.25rem 0 0;
    color: var(--explorer-muted);
    font-size: 0.9rem;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .controls button {
    padding: 0.35rem 0.8rem;
    border: 1px solid var(--explorer-border);
    border-radius: 0.4rem;
    background: white;
    cursor: pointer;
  }
  .controls button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .color {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--explorer-muted);
    font-size: 0.85rem;
  }
  .surfaces {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    overflow: auto;
  }
  .surface {
    max-width: 42rem;
  }
  h2 {
    margin: 1rem 0 0.5rem;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--explorer-muted);
  }
  h3 {
    margin: 0.5rem 0 0.25rem;
    font-size: 0.8rem;
  }
  pre {
    margin: 0;
    padding: 0.5rem;
    border-radius: 0.4rem;
    background: white;
    border: 1px solid var(--explorer-border);
    font-size: 0.72rem;
    overflow: auto;
    max-height: 16rem;
  }
  .messages,
  .events {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .messages li {
    opacity: 0.45;
  }
  .messages li.processed {
    opacity: 1;
  }
  .event-meta {
    display: block;
    color: var(--explorer-muted);
    font-size: 0.75rem;
    margin-bottom: 0.15rem;
  }
  .events li[data-kind='error'] pre {
    border-color: #fca5a5;
  }
  .empty {
    color: var(--explorer-muted);
    font-size: 0.85rem;
  }
</style>
