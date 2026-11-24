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
  import {renderLog} from './render_log.js';

  let {props, node}: SvelteA2uiComponentProps<{text?: string}> = $props();

  $effect.pre(() => {
    renderLog.push({componentId: node.componentId, text: props.text});
  });
</script>

<span data-testid={`tracked-${node.componentId}`}>{props.text}</span>
