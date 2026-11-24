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
  A conversation with the scripted agent in `/api/agent` over HTTP and JSON
  Lines: the page reads the agent's messages as they stream in, and posts
  each action the user triggers back to it.
-->
<script lang="ts">
  import {
    type ActionPayload,
    MessageProcessor,
    type ProcessableMessage,
    type SurfaceModel,
  } from '@a2ui/web_core';
  import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
  import {A2uiSurface, type SvelteCatalogComponent} from '@conalog/a2ui-svelte';

  import {readJsonLines} from '#lib/jsonl.js';

  type Status = 'connecting' | 'idle' | 'failed';

  let surfaces = $state.raw<ReadonlyArray<SurfaceModel<SvelteCatalogComponent>>>([]);
  let status = $state<Status>('connecting');
  let failure = $state('');
  let received = $state(0);
  let sent = $state.raw<readonly string[]>([]);

  const processor = new MessageProcessor<SvelteCatalogComponent>([basicCatalog], action => {
    void send(toActionMessage(action));
  });
  processor.model.onSurfaceCreated.subscribe(surface => {
    surfaces = [...surfaces, surface];
  });
  processor.model.onSurfaceDeleted.subscribe(id => {
    surfaces = surfaces.filter(surface => surface.id !== id);
  });

  /** The wire form of an action: the payload without renderer-local fields. */
  function toActionMessage(action: ActionPayload) {
    return {
      version: '1.0',
      action: {
        name: action.name,
        surfaceId: action.surfaceId,
        sourceComponentId: action.sourceComponentId,
        timestamp: action.timestamp,
        context: action.context ?? {},
      },
    };
  }

  async function send(message?: {version: string; action: {name: string}}): Promise<void> {
    status = 'connecting';
    if (message) sent = [...sent, message.action.name];
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(message ? {message} : {}),
      });
      if (!response.ok) {
        throw new Error(`The agent answered ${response.status} ${response.statusText}.`);
      }
      for await (const line of readJsonLines(response)) {
        await processor.processMessagesAsync([line as ProcessableMessage]);
        received += 1;
      }
      status = 'idle';
    } catch (error) {
      status = 'failed';
      failure = error instanceof Error ? error.message : String(error);
    }
  }

  $effect(() => {
    void send();
  });
</script>

<main class="agent">
  <header>
    <h1>Live agent</h1>
    <p>
      The page reads messages from <code>POST /api/agent</code> as JSON Lines while they stream in, and
      posts each action back. The agent is a script; the transport code is the same for a real one.
    </p>
    <p class="status" data-testid="agent-status" data-status={status}>
      {#if status === 'connecting'}Waiting for the agent…{:else if status === 'failed'}{failure}{:else}{received}
        messages received{#if sent.length > 0}, sent: {sent.join(', ')}{/if}{/if}
    </p>
  </header>

  {#each surfaces as surface (surface.id)}
    <div class="surface" data-surface-id={surface.id}>
      <A2uiSurface {surface} />
    </div>
  {/each}
</main>

<style>
  .agent {
    max-width: 40rem;
    padding: 1.5rem 1.25rem;
  }
  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
  }
  p {
    margin: 0 0 0.75rem;
    color: var(--explorer-muted);
  }
  .status[data-status='failed'] {
    color: #b91c1c;
  }
  .surface {
    margin-top: 1rem;
  }
</style>
