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
  The content a host mounts itself when a universal element created it. The
  mount starts a separate Svelte root, so errors from the content would not
  reach the application's boundaries. This boundary hands them to the owner,
  which rethrows them where the application's boundaries do catch them.
-->
<script lang="ts">
  import type {ComponentNode} from '@a2ui/web_core';
  import type {HostOwner} from './host_registry.js';
  import NodeContent from './NodeContent.svelte';
  import type {SvelteCatalogComponent} from './svelte_component_implementation.js';

  let {node, owner}: {node: ComponentNode<SvelteCatalogComponent>; owner: HostOwner | null} =
    $props();

  function forward(error: unknown) {
    if (owner) {
      owner.reportError(error);
    } else {
      console.error(error);
    }
  }
</script>

<svelte:boundary onerror={forward}>
  <NodeContent {node} />
</svelte:boundary>
