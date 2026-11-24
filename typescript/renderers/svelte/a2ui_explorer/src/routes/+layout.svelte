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
  import {renderMarkdown} from '@a2ui/markdown-it';
  import {injectBasicCatalogStyles} from '@a2ui/web_core/catalogs/basic/v1';
  import {setMarkdownContext} from '@conalog/a2ui-svelte';
  import {page} from '$app/state';

  let {children} = $props();

  // Adopts the basic catalog's default stylesheet; it does nothing during SSR.
  injectBasicCatalogStyles();
  setMarkdownContext(renderMarkdown);
</script>

<svelte:head>
  <title>A2UI Svelte Explorer</title>
</svelte:head>

<div class="app">
  <header class="topbar">
    <a class="brand" href="/">A2UI Svelte Explorer</a>
    <nav aria-label="Main">
      <a href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>Gallery</a>
      <a href="/agent" aria-current={page.url.pathname === '/agent' ? 'page' : undefined}>
        Live agent
      </a>
    </nav>
  </header>
  {@render children()}
</div>

<style>
  :global(:root) {
    color-scheme: light;
    --explorer-border: #e2e8f0;
    --explorer-muted: #64748b;
    --explorer-panel: #f8fafc;
    --explorer-accent: #0f766e;
    font-family: system-ui, sans-serif;
  }
  :global(body) {
    margin: 0;
    color: #0f172a;
    background: #ffffff;
  }
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .topbar {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.6rem 1.25rem;
    border-bottom: 1px solid var(--explorer-border);
  }
  .brand {
    font-weight: 700;
    color: inherit;
    text-decoration: none;
  }
  nav {
    display: flex;
    gap: 1rem;
  }
  nav a {
    color: var(--explorer-muted);
    text-decoration: none;
  }
  nav a[aria-current='page'] {
    color: var(--explorer-accent);
    font-weight: 600;
  }
</style>
