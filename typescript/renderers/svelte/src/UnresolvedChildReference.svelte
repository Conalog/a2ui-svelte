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
  Stands in for a `buildChild` argument that names no child of the node. It
  renders nothing, like the other unresolved states, and reports the
  reference through the surface's error channel once per (id, path), as the
  resolver does for unknown types and cycles. The report runs in an effect so
  that error listeners never run while Svelte renders.
-->
<script lang="ts">
  import type {SurfaceModel} from '@a2ui/web_core';
  import {reportUnresolvedChild} from './node-view.svelte.js';
  import type {SvelteCatalogComponent} from './svelte_component_implementation.js';

  let {
    surface,
    id,
    requestedPath,
  }: {
    surface: SurfaceModel<SvelteCatalogComponent>;
    id: string;
    requestedPath: string;
  } = $props();

  $effect(() => {
    reportUnresolvedChild(surface, id, requestedPath);
  });
</script>
