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
  import type {SurfaceModel} from '@a2ui/web_core';
  import {A2uiSurface, type SvelteCatalogComponent} from '../../src/index.js';

  let {surface}: {surface: SurfaceModel<SvelteCatalogComponent>} = $props();
</script>

<svelte:boundary>
  <A2uiSurface {surface} />
  {#snippet failed(error)}
    <p data-testid="boundary-failed">{(error as Error).message}</p>
  {/snippet}
</svelte:boundary>
