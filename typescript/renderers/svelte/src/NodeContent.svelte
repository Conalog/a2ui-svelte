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
  The content of one host: the node's Svelte implementation, with children
  rendered as their elements. It subscribes to this node's props only, so a
  data change re-renders exactly the component whose props changed.
-->
<script lang="ts">
  import type {ComponentNode} from '@a2ui/web_core';
  import {hostRefsOf} from './catalog/host_accessibility.js';
  import ChildElement from './ChildElement.svelte';
  import {
    childToken,
    fromSignal,
    getA2uiSurface,
    resolveChild,
    surfaceOf,
    toViewProps,
  } from './node-view.svelte.js';
  import {
    isSvelteComponentImplementation,
    type NodeChild,
    type SvelteCatalogComponent,
  } from './svelte_component_implementation.js';
  import UnresolvedChildReference from './UnresolvedChildReference.svelte';

  let {node}: {node: ComponentNode<SvelteCatalogComponent>} = $props();

  const ambientSurface = getA2uiSurface();
  const surface = $derived(ambientSurface ?? surfaceOf(node));
  const resolvedProps = $derived(fromSignal(node.props));
  const metadata = $derived(fromSignal(node.metadata));
  const view = $derived(toViewProps(resolvedProps.current));
  const refs = $derived(hostRefsOf(node));
  const implementation = $derived(
    isSvelteComponentImplementation(node.impl) && !node.disposed ? node.impl : undefined,
  );
</script>

{#snippet buildChild(child: NodeChild)}
  {@const childNode = resolveChild(child, view.children)}
  {#if childNode}
    <ChildElement node={childNode} />
  {:else if surface}
    <UnresolvedChildReference {surface} id={childToken(child)} requestedPath={node.dataPath} />
  {/if}
{/snippet}

{#if implementation}
  <implementation.component
    props={view.props}
    {buildChild}
    {node}
    metadata={metadata.current}
    accessibilityRef={refs.accessibilityRef}
    validationErrorsRef={refs.validationErrorsRef}
  />
{/if}
