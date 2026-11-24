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
  Renders one A2UI surface.

  `A2uiSurface` owns one `NodeResolver` for the surface it is given, tracks
  the resolved root node and renders its element. Everything below the root,
  including dispatch to each implementation and child reference resolution,
  lives in `ChildElement` and `NodeContent`.

  ```svelte
  <A2uiSurface {surface} />
  ```
-->
<script lang="ts">
  import {
    type ComponentNode,
    effect as signalEffect,
    getValue,
    NodeResolver,
    type SurfaceModel,
  } from '@a2ui/web_core';
  import {setMarkdownRenderer} from '@a2ui/web_core/universal';
  import {prepareCatalogs} from './catalog/prepare_catalogs.js';
  import ChildElement from './ChildElement.svelte';
  import {getMarkdownComponentContext, getMarkdownContext} from './markdown-context.js';
  import {registerMarkdownHostRenderer} from './markdown_hosts.js';
  import {setSurfaceContext} from './node-view.svelte.js';
  import type {SvelteCatalogComponent} from './svelte_component_implementation.js';

  let {surface}: {surface: SurfaceModel<SvelteCatalogComponent>} = $props();

  setSurfaceContext(() => surface);

  // web_core's basic catalog reads its Markdown renderer from a module-level
  // slot. Setting it before the effects below lets every element in the
  // surface find it on its first update. A surface without a renderer leaves
  // the slot alone, so one the application set itself stays in effect. A
  // Markdown component takes precedence: its renderer returns hosts that mount
  // the component (see `markdown_hosts.ts`), and it leaves the slot when the
  // last surface using it unmounts.
  const markdownRenderer = getMarkdownContext();
  const hasMarkdownComponent = getMarkdownComponentContext() !== undefined;
  $effect.pre(() => {
    if (hasMarkdownComponent) {
      return registerMarkdownHostRenderer();
    }
    if (markdownRenderer) {
      setMarkdownRenderer(markdownRenderer);
    }
    return undefined;
  });

  // The resolved root, with the surface it belongs to. When the surface prop
  // changes, the template re-renders before the effect below tears down the old
  // resolver; pairing the two keeps the old root from rendering under the new
  // surface in between.
  let resolved = $state.raw<{
    surface: SurfaceModel<SvelteCatalogComponent>;
    root: ComponentNode<SvelteCatalogComponent> | undefined;
  }>();
  const root = $derived(resolved?.surface === surface ? resolved.root : undefined);

  // The resolver lives in an effect, so it exists only in the browser and only
  // while the surface is shown. A new surface disposes the old resolver.
  $effect(() => {
    const current = surface;
    prepareCatalogs(current);
    const created = current.componentsModel.onCreated.subscribe(() => {
      prepareCatalogs(current);
    });
    const resolver = new NodeResolver(current, current.defaultCatalog);
    const stopRoot = signalEffect(() => {
      resolved = {surface: current, root: getValue(resolver.rootNode)};
    });
    return () => {
      stopRoot();
      created.unsubscribe();
      resolver.dispose();
      resolved = undefined;
    };
  });
</script>

{#key surface}
  {#if root}
    <ChildElement node={root} />
  {/if}
{/key}
