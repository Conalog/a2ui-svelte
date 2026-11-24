/*
 * Copyright 2026 The a2ui-svelte Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Renders the Markdown of web_core's basic catalog `Text` through the Svelte
 * component set with `setMarkdownComponentContext`.
 *
 * web_core's `Text` renders Markdown with a function that returns HTML. When
 * the application sets a Markdown component, `A2uiSurface` registers
 * `renderMarkdownHost`, which returns an `<a2ui-svelte-markdown>` element
 * holding the Markdown in an attribute. The element mounts the component into
 * itself with the Svelte context of the nearest element above it that Svelte
 * rendered, so the component reads the application's context.
 */

import {type Component, mount, unmount} from 'svelte';
import type {MarkdownRenderer} from '@a2ui/web_core';
import {getMarkdownRenderer, setMarkdownRenderer} from '@a2ui/web_core/universal';
import {ownerAbove} from './host_registry.js';
import {MARKDOWN_COMPONENT_KEY, type MarkdownComponentProps} from './markdown-context.js';

const TAG = 'a2ui-svelte-markdown';
const ATTRIBUTE = 'data-markdown';

/**
 * Defines `<a2ui-svelte-markdown>` on first use, so importing the package does
 * not need a DOM.
 */
function defineMarkdownHost(): void {
  if (customElements.get(TAG)) return;
  customElements.define(
    TAG,
    class extends HTMLElement {
      private instance?: Record<string, unknown>;

      connectedCallback() {
        this.style.display = 'contents';
        if (this.instance) return;
        const owner = ownerAbove(this);
        const component = owner?.contexts.get(MARKDOWN_COMPONENT_KEY) as
          Component<MarkdownComponentProps> | undefined;
        if (!owner || !component) return;
        this.instance = mount(component, {
          target: this,
          props: {markdown: this.getAttribute(ATTRIBUTE) ?? ''},
          context: owner.contexts,
        });
      }

      disconnectedCallback() {
        // Deferred, so re-parenting keeps the component and its state.
        queueMicrotask(() => {
          if (!this.isConnected && this.instance) {
            void unmount(this.instance);
            this.instance = undefined;
          }
        });
      }
    },
  );
}

/** Escapes text for a double-quoted HTML attribute value. */
function escapeAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * The Markdown renderer `A2uiSurface` registers with web_core for a Markdown
 * component. The Markdown only ever reaches the page as an escaped attribute
 * value, and the component receives it back as a string.
 */
export const renderMarkdownHost: MarkdownRenderer = async markdown => {
  defineMarkdownHost();
  return `<${TAG} ${ATTRIBUTE}="${escapeAttribute(markdown)}"></${TAG}>`;
};

/** How many mounted surfaces have registered `renderMarkdownHost`. */
let hostRendererUsers = 0;
/** The renderer web_core had before the first of those surfaces registered it. */
let rendererBeforeHosts: MarkdownRenderer | undefined;

/**
 * Registers `renderMarkdownHost` with web_core for a surface that has a
 * Markdown component, and returns the function that releases it. When the last
 * such surface releases it, the renderer web_core had before comes back, unless
 * something replaced `renderMarkdownHost` in the meantime.
 */
export function registerMarkdownHostRenderer(): () => void {
  if (hostRendererUsers++ === 0) {
    rendererBeforeHosts = getMarkdownRenderer();
  }
  setMarkdownRenderer(renderMarkdownHost);
  return () => {
    if (--hostRendererUsers === 0 && getMarkdownRenderer() === renderMarkdownHost) {
      setMarkdownRenderer(rendererBeforeHosts);
    }
  };
}
