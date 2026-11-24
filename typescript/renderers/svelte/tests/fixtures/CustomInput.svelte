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

<script lang="ts">
  import type {SvelteA2uiComponentProps} from '../../src/index.js';

  let {
    props,
    accessibilityRef,
    validationErrorsRef,
  }: SvelteA2uiComponentProps<{
    label?: string;
    value?: string;
    setValue: (value: string) => void;
    validationErrors?: string[];
  }> = $props();
</script>

<label>
  {props.label}
  <input
    data-testid="custom-input"
    value={props.value ?? ''}
    oninput={event => props.setValue(event.currentTarget.value)}
    {@attach accessibilityRef}
  />
</label>
{#if props.validationErrors?.length}
  <p data-testid="custom-input-errors" {@attach validationErrorsRef}>
    {props.validationErrors.join(' ')}
  </p>
{/if}
