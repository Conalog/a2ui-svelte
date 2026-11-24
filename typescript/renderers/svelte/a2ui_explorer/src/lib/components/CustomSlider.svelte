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
  A slider written in Svelte, bound two ways through `setValue`.
-->
<script lang="ts">
  import type {SvelteA2uiComponentProps} from '@conalog/a2ui-svelte';

  let {
    props,
    accessibilityRef,
  }: SvelteA2uiComponentProps<{
    label?: string;
    value?: number;
    min?: number;
    max?: number;
    setValue?: (value: number) => void;
  }> = $props();

  const value = $derived(typeof props.value === 'number' ? props.value : 0);
</script>

<label class="custom-slider">
  <span>{props.label ?? 'Value'}: {value}</span>
  <input
    type="range"
    min={props.min ?? 0}
    max={props.max ?? 100}
    {value}
    oninput={event => props.setValue?.(Number(event.currentTarget.value))}
    {@attach accessibilityRef}
  />
</label>

<style>
  .custom-slider {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.6rem;
    border: 1px dashed #2563eb;
    border-radius: 0.4rem;
    font-size: 0.85rem;
  }
  input {
    width: 100%;
  }
</style>
