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
  @component
  A container written in Svelte: a 2x2 grid with up to four children, which
  may be Svelte components or basic catalog elements.
-->
<script lang="ts">
  import type {SvelteA2uiComponentProps} from '@conalog/a2ui-svelte';

  let {
    props,
    buildChild,
  }: SvelteA2uiComponentProps<{title?: string; description?: string; children?: unknown[]}> =
    $props();

  const slots = $derived(
    [0, 1, 2, 3].map(index => (props.children as string[] | undefined)?.[index]),
  );
</script>

<div class="grid-wrapper">
  {#if props.title}
    <h3>{props.title}</h3>
    {#if props.description}<p>{props.description}</p>{/if}
  {/if}
  <div class="grid">
    {#each slots as child, index (index)}
      <div class="cell" class:empty={!child}>
        <span class="slot">Slot {index + 1}</span>
        {#if child}
          {@render buildChild(child)}
        {:else}
          <span class="placeholder">Empty child</span>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .grid-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  h3 {
    margin: 0;
    font-size: 1rem;
  }
  p {
    margin: 0;
    color: #64748b;
    font-size: 0.85rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .cell {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.6rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
  }
  .cell.empty {
    border-style: dashed;
  }
  .slot,
  .placeholder {
    color: #64748b;
    font-size: 0.75rem;
  }
</style>
