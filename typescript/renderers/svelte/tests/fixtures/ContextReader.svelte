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
  import {getContext} from 'svelte';
  import type {SvelteA2uiComponentProps} from '../../src/index.js';

  let {props}: SvelteA2uiComponentProps<{label?: string}> = $props();
  const theme = getContext<string | undefined>('app-theme');
</script>

<span data-testid="context-reader" data-theme={theme ?? 'none'}>{props.label}</span>
