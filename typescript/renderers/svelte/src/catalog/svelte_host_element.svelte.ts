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

import {mount, unmount} from 'svelte';
import type {ComponentNode} from '@a2ui/web_core';
import {type A2uiWebComponentElement, bindHostAccessibility} from '@a2ui/web_core/universal';
import {type HostOwner, isSvelteRendered, ownerAbove} from '../host_registry.js';
import HostedContent from '../HostedContent.svelte';
import type {SvelteCatalogComponent} from '../svelte_component_implementation.js';
import {hostRefsOf} from './host_accessibility.js';

/**
 * The custom element that stands in the DOM for a node implemented in Svelte
 * (for example `<a2ui-svelte-badge>`). It holds no implementation. When Svelte
 * creates it, Svelte renders the node's content as its children. When another
 * renderer creates it (a Lit `Column` rendering its children), it mounts the
 * content itself, with the Svelte context of the nearest element above it
 * that Svelte rendered, and hands errors from the content to that element.
 *
 * The host applies the node's `accessibility` attributes and validation
 * state itself, so every Svelte implementation gets them (see
 * `host_accessibility.ts`).
 */
export interface SvelteHostElement extends A2uiWebComponentElement {
  node?: ComponentNode<SvelteCatalogComponent>;
}

// Importing this module must not need a DOM, so it can load during server-side rendering and in
// plain Node. Without `HTMLElement` the base is an empty class. Nothing can define or create the
// element there, because `customElements` is missing too.
const ElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined' ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

/** Content this host mounted itself, because Svelte did not render the host. */
interface MountedContent {
  readonly instance: Record<string, unknown>;
  readonly props: {node: ComponentNode<SvelteCatalogComponent>; owner: HostOwner | null};
  readonly owner: HostOwner | null;
}

/** The behaviour every host shares; `toWebComponent` derives one subclass per tag name. */
export class SvelteWcHost extends ElementBase implements SvelteHostElement {
  private _node?: ComponentNode<SvelteCatalogComponent>;
  private content?: MountedContent;
  private accessibilityNode?: ComponentNode<SvelteCatalogComponent>;
  private stopAccessibility?: () => void;

  connectedCallback() {
    this.style.display = 'contents';
    this.mountContent();
    this.bindAccessibility();
  }

  disconnectedCallback() {
    // Deferred, so re-parenting (a disconnect and a connect in the same
    // task) keeps the content and its state.
    queueMicrotask(() => {
      if (!this.isConnected) {
        this.unmountContent();
        this.unbindAccessibility();
      }
    });
  }

  set node(node: ComponentNode<SvelteCatalogComponent> | undefined) {
    this._node = node;
    this.mountContent();
    this.bindAccessibility();
  }

  get node(): ComponentNode<SvelteCatalogComponent> | undefined {
    return this._node;
  }

  /** Mounts the node's content when another renderer created this host. */
  private mountContent() {
    const node = this._node;
    if (!this.isConnected || !node || isSvelteRendered(this)) return;
    const owner = ownerAbove(this);
    if (this.content && this.content.owner === owner) {
      this.content.props.node = node;
      return;
    }
    // A move under another owner remounts with that owner's context.
    this.unmountContent();
    const props = $state({node, owner});
    // A copy, so a context the content sets never reaches the owner. Svelte reads
    // contexts from a plain Map; it is not view state.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const context = new Map(owner?.contexts);
    this.content = {instance: mount(HostedContent, {target: this, props, context}), props, owner};
  }

  private unmountContent() {
    if (this.content) {
      void unmount(this.content.instance);
      this.content = undefined;
    }
  }

  /** Keeps the ARIA attributes in step with the node while the host is connected. */
  private bindAccessibility() {
    const node = this._node;
    if (!this.isConnected || node === this.accessibilityNode) return;
    this.unbindAccessibility();
    this.accessibilityNode = node;
    if (node) {
      this.stopAccessibility = bindHostAccessibility(this, node, hostRefsOf(node));
    }
  }

  private unbindAccessibility() {
    this.stopAccessibility?.();
    this.stopAccessibility = undefined;
    this.accessibilityNode = undefined;
  }
}
