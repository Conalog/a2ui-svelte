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
  import {type Component, setContext} from 'svelte';
  import type {MarkdownRenderer, SurfaceModel} from '@a2ui/web_core';
  import {
    A2uiSurface,
    type MarkdownComponentProps,
    setMarkdownComponentContext,
    setMarkdownContext,
    type SvelteCatalogComponent,
  } from '../../src/index.js';

  let {
    surface,
    contexts = {},
    markdownRenderer,
    markdownComponent,
  }: {
    surface: SurfaceModel<SvelteCatalogComponent>;
    contexts?: Record<string, unknown>;
    markdownRenderer?: MarkdownRenderer;
    markdownComponent?: Component<MarkdownComponentProps>;
  } = $props();

  // svelte-ignore state_referenced_locally
  setMarkdownContext(markdownRenderer);
  // svelte-ignore state_referenced_locally
  setMarkdownComponentContext(markdownComponent);

  // The fixture sets its contexts once, as a real app does while it initializes.
  // svelte-ignore state_referenced_locally
  for (const [key, value] of Object.entries(contexts)) {
    setContext(key, value);
  }
</script>

<A2uiSurface {surface} />
