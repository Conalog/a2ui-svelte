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
 * What a Svelte catalog entry is, and what its component receives.
 *
 * These types refer to each other: an implementation's component takes
 * `SvelteA2uiComponentProps`, whose `node` holds an entry of the same catalog.
 * Keeping them together lets `adapter.ts` build implementations and
 * `catalog/to_web_component.ts` host them without importing each other.
 */

import type {Component, Snippet} from 'svelte';
import type {Attachment} from 'svelte/attachments';
import type {ZodTypeAny} from 'zod';
import type {A2uiMetadata, ComponentApi, ComponentNode, ResolvedChildRef} from '@a2ui/web_core';
import type {WebComponentImplementation} from '@a2ui/web_core/universal';

/**
 * A child reference as it appears in view props (a token), or a resolved
 * child node. `buildChild` takes either.
 */
export type NodeChild = string | ResolvedChildRef | ComponentNode<SvelteCatalogComponent>;

/**
 * Renders one child: `{@render buildChild(child)}`. A token that names no
 * child of this node renders nothing and is reported once through the
 * surface's error channel.
 */
export type NodeBuildChild = Snippet<[child: NodeChild]>;

/** What a Svelte component registered with `createComponentImplementation` receives. */
export interface SvelteA2uiComponentProps<T = Record<string, unknown>> {
  /**
   * The node's resolved properties. Dynamic values arrive as values, each
   * writable one with a `set<Name>` setter; actions arrive as functions; child
   * references arrive as tokens for `buildChild`.
   */
  props: T;
  /** Renders a child reference from `props`. */
  buildChild: NodeBuildChild;
  /** The resolved node this component renders. */
  node: ComponentNode<SvelteCatalogComponent>;
  /** The component's envelope metadata. Reading it subscribes to it. */
  metadata: A2uiMetadata | undefined;
  /**
   * Attach to the element that should carry `accessibility.label`,
   * `accessibility.description` and the validation state, such as the
   * component's input (`<input {@attach accessibilityRef}>`). It gets
   * `aria-invalid` while a check fails. Without it, the host element is
   * labelled as a `role="group"` and no element gets the validation state.
   */
  accessibilityRef: Attachment<Element>;
  /**
   * Attach to the element that shows the validation errors. While there are
   * errors, the `accessibilityRef` element gets `aria-describedby` pointing at
   * it, and it gets an `id` if it has none.
   */
  validationErrorsRef: Attachment<Element>;
}

/** A catalog entry implemented as a Svelte component. */
export interface SvelteComponentImplementation<
  Schema extends ZodTypeAny = ZodTypeAny,
> extends ComponentApi<Schema> {
  // The props type is erased here so that one catalog can hold components
  // with different props; `createComponentImplementation` checks it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly component: Component<SvelteA2uiComponentProps<any>>;
}

/** Any entry a Svelte catalog can hold: a Svelte component or a Web Component. */
export type SvelteCatalogComponent<Schema extends ZodTypeAny = ZodTypeAny> =
  SvelteComponentImplementation<Schema> | WebComponentImplementation<Schema>;

/** Whether `entry` renders through a Svelte component. */
export function isSvelteComponentImplementation(
  entry: unknown,
): entry is SvelteComponentImplementation {
  return (
    !!entry &&
    typeof entry === 'object' &&
    typeof (entry as Partial<SvelteComponentImplementation>).component === 'function'
  );
}
