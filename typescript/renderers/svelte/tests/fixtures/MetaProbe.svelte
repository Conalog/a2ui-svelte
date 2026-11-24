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
  import {fromSignal, getA2uiSurface, type SvelteA2uiComponentProps} from '../../src/index.js';
  import {renderLog} from './render_log.js';

  let {props, node, metadata}: SvelteA2uiComponentProps<{label?: string}> = $props();

  const surface = getA2uiSurface();
  const surfaceMetadata = surface ? fromSignal(surface.metadataSignal) : undefined;

  const text = $derived.by(() => {
    const instance = (metadata?.extensions?.['badge'] as string | undefined) ?? 'none';
    const surfaceBadge =
      (surfaceMetadata?.current?.extensions?.['theme_mode'] as string | undefined) ?? 'none';
    const catalogHint =
      (node.impl?.metadata?.extensions?.['catalog_hint'] as string | undefined) ?? 'none';
    return `${props.label ?? ''}|inst:${instance}|surf:${surfaceBadge}|cat:${catalogHint}`;
  });

  $effect.pre(() => {
    renderLog.push({componentId: node.componentId, text});
  });
</script>

<div data-testid="meta-probe">{text}</div>
