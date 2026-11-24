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
  Renders one node as its implementation's custom element. A node that is
  not resolved (pending, unknown type, cyclic) renders nothing: the resolver
  has already reported unknown types and cycles to the surface, and a pending
  node is replaced in place when its component arrives.

  For a Svelte implementation the element is a host, and its content renders
  as the element's children. A Web Component renders its own children; the
  Svelte hosts it creates mount their content with the context captured here,
  and report their errors back here.
-->
<script lang="ts">
  import {getAllContexts} from 'svelte';
  import type {Attachment} from 'svelte/attachments';
  import type {ComponentNode} from '@a2ui/web_core';
  import {
    type A2uiWebComponentElement,
    isWebComponentImplementation,
    registerUniversalElement,
  } from '@a2ui/web_core/universal';
  import {HostOwner, markSvelteRendered} from './host_registry.js';
  import NodeContent from './NodeContent.svelte';
  import {
    isSvelteComponentImplementation,
    type SvelteCatalogComponent,
  } from './svelte_component_implementation.js';

  let {node}: {node: ComponentNode<SvelteCatalogComponent>} = $props();

  // An error from Svelte content that a host below this element mounted itself
  // is rethrown here, so the application's error boundaries see it as they see
  // errors from content Svelte rendered directly.
  let hostedError = $state.raw<{error: unknown}>();
  $effect(() => {
    if (hostedError) throw hostedError.error;
  });

  const owner = new HostOwner(getAllContexts(), error => {
    hostedError = {error};
  });

  const tagName = $derived(elementTagFor(node));
  const hostsSvelte = $derived(isSvelteComponentImplementation(node.impl));

  /** The tag to render for `node`, defining its element first; none for a placeholder. */
  function elementTagFor(current: ComponentNode<SvelteCatalogComponent>): string | undefined {
    if (current.isPlaceholder || current.disposed) {
      return undefined;
    }
    const implementation = current.impl;
    if (!isWebComponentImplementation(implementation)) {
      throw new Error(
        `A2UI catalog entry '${current.type}' has no element. A2uiSurface prepares the ` +
          `surface's default and available catalogs; this entry came from another catalog.`,
      );
    }
    registerUniversalElement(implementation);
    return implementation.tagName;
  }

  // Before `node`: a host decides whether to mount its own content when it gets one.
  const bindNode: Attachment<HTMLElement> = element => {
    markSvelteRendered(element, owner);
    (element as A2uiWebComponentElement).node = node;
  };
</script>

{#if tagName && hostsSvelte}
  <svelte:element this={tagName} {@attach bindNode}>
    <NodeContent {node} />
  </svelte:element>
{:else if tagName}
  <svelte:element this={tagName} {@attach bindNode} />
{/if}
