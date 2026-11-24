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
  A Svelte component registered in the demo catalog. The basic catalog does
  not have a badge, so an agent that knows the demo catalog can ask for one.
-->
<script lang="ts">
  import type {SvelteA2uiComponentProps} from '@conalog/a2ui-svelte';

  let {
    props,
  }: SvelteA2uiComponentProps<{label?: string; tone?: 'neutral' | 'positive' | 'warning'}> =
    $props();
</script>

<span class="badge" data-tone={props.tone ?? 'neutral'} data-testid="status-badge">
  {props.label}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
    padding: 0.2em 0.7em;
    border-radius: 999px;
    font: 600 0.85rem/1.4 var(--a2ui-font-family, system-ui, sans-serif);
    background: color-mix(in srgb, var(--badge-color) 14%, transparent);
    color: var(--badge-color);
    --badge-color: var(--a2ui-color-on-background, #334155);
  }
  .badge::before {
    content: '';
    width: 0.5em;
    height: 0.5em;
    border-radius: 50%;
    background: currentColor;
  }
  .badge[data-tone='positive'] {
    --badge-color: #15803d;
  }
  .badge[data-tone='warning'] {
    --badge-color: #b45309;
  }
</style>
