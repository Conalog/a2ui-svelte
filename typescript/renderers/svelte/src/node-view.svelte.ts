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
 * The pieces of the node rendering layer that are not components: reading
 * web_core signals from Svelte, the surface context, and turning a node's
 * resolved props into the props an implementation receives.
 */

import {getContext, setContext} from 'svelte';
import {createSubscriber} from 'svelte/reactivity';
import {
  type ComponentNode,
  effect,
  getValue,
  isComponentNode,
  isWritable,
  type NodeProps,
  peekValue,
  ResolvedBinding,
  type Signal,
  type SurfaceModel,
} from '@a2ui/web_core';
import type {NodeChild, SvelteCatalogComponent} from './svelte_component_implementation.js';

/**
 * Reads a web_core signal from Svelte. Reading `current` in a template,
 * `$derived` or `$effect` subscribes to the signal, and the subscription ends
 * when nothing reads it any more, so a view that unmounts drops it without
 * further code. Reading `current` anywhere else returns the value without
 * subscribing.
 */
export function fromSignal<T>(signal: Signal<T>): {readonly current: T} {
  const subscribe = createSubscriber(update => {
    // web_core's effect runs once right away; that run is the subscription
    // itself, not a change.
    let first = true;
    return effect(() => {
      getValue(signal);
      if (first) {
        first = false;
      } else {
        update();
      }
    });
  });
  return {
    get current() {
      subscribe();
      return peekValue(signal);
    },
  };
}

const SURFACE_KEY = Symbol('a2ui.surface');

/** Publishes the surface to the views below `A2uiSurface`. */
export function setSurfaceContext(getSurface: () => SurfaceModel<SvelteCatalogComponent>): void {
  setContext(SURFACE_KEY, getSurface);
}

/**
 * Returns the {@link SurfaceModel} of the enclosing `A2uiSurface`, or
 * `undefined` outside one. Call it while a component initializes, as with any
 * Svelte context.
 */
export function getA2uiSurface(): SurfaceModel<SvelteCatalogComponent> | undefined {
  return getContext<(() => SurfaceModel<SvelteCatalogComponent>) | undefined>(SURFACE_KEY)?.();
}

/** The surface a node belongs to, for views rendered outside `A2uiSurface`. */
export function surfaceOf(node: ComponentNode): SurfaceModel<SvelteCatalogComponent> | undefined {
  return node.context?.dataContext.surface as SurfaceModel<SvelteCatalogComponent> | undefined;
}

/** The child nodes of one view by token, in prop order. */
export type ChildIndex = Map<string, ComponentNode<SvelteCatalogComponent>>;

/** What `toViewProps` produces: the props an implementation receives, and its children. */
export interface ViewState {
  readonly props: Record<string, unknown>;
  readonly children: ChildIndex;
}

/**
 * Converts a node's resolved props to the props its implementation receives.
 *
 * Each `ResolvedBinding` becomes its value plus a `set<Prop>` setter (one that
 * does nothing for a binding that is not writable), and each child node
 * becomes a token, its `instanceId`, collected in `children` for `buildChild`.
 * The token is the `instanceId` rather than the node object or `node.id`
 * because it stays the same while core replaces the node object behind it, so
 * it is a stable `{#each}` key.
 */
export function toViewProps(props: NodeProps): ViewState {
  // Rebuilt with every props emission and never mutated afterwards.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const children: ChildIndex = new Map();
  return {props: convertObject(props, children), children};
}

function convertObject(
  props: Record<string, unknown>,
  children: ChildIndex,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(props)) {
    if (inner instanceof ResolvedBinding) {
      result[key] = convertValue(inner.value, children);
      result[`set${key.charAt(0).toUpperCase()}${key.slice(1)}`] = isWritable(inner)
        ? inner.set
        : ignoreWrite;
    } else {
      result[key] = convertValue(inner, children);
    }
  }
  return result;
}

function convertValue(value: unknown, children: ChildIndex): unknown {
  if (isComponentNode(value)) {
    // Every node in this surface's props came from its own resolver, whose
    // catalogs hold SvelteCatalogComponent entries.
    children.set(value.instanceId, value as ComponentNode<SvelteCatalogComponent>);
    return value.instanceId;
  }
  if (value instanceof ResolvedBinding) {
    return convertValue(value.value, children);
  }
  if (Array.isArray(value)) {
    return value.map(item => convertValue(item, children));
  }
  if (isPlainObject(value)) {
    return convertObject(value, children);
  }
  // Rebuilding a Map, Date or class instance key by key would strip its prototype.
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function ignoreWrite(): void {}

/** The node a `buildChild` argument names among `children`, if any. */
export function resolveChild(
  child: NodeChild,
  children: ChildIndex,
): ComponentNode<SvelteCatalogComponent> | undefined {
  if (isComponentNode(child)) {
    return child as ComponentNode<SvelteCatalogComponent>;
  }
  return children.get(typeof child === 'string' ? child : child.id);
}

/** The token `buildChild` was given, for diagnostics. */
export function childToken(child: NodeChild): string {
  if (isComponentNode(child)) {
    return child.instanceId;
  }
  return typeof child === 'string' ? child : child.id;
}

/** Unresolved-reference reports already dispatched, per surface. */
const reportedUnresolved = new WeakMap<SurfaceModel<SvelteCatalogComponent>, Set<string>>();

/**
 * Reports a `buildChild` argument that names no child of the node, once per
 * (id, path) and surface. The resolver turns every child reference it can
 * identify into a node, so a leftover id was never classified; the message
 * names the two causes a catalog author can have.
 */
export function reportUnresolvedChild(
  surface: SurfaceModel<SvelteCatalogComponent>,
  id: string,
  requestedPath: string,
): void {
  let seen = reportedUnresolved.get(surface);
  if (!seen) {
    // Bookkeeping for reports, not view state.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    seen = new Set();
    reportedUnresolved.set(surface, seen);
  }
  const key = JSON.stringify([id, requestedPath]);
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  const detail = surface.componentsModel.get(id)
    ? 'the component exists, but it is not a child of this node, or the catalog schema does ' +
      'not mark the referencing property as a component id. Use componentId() or childList() ' +
      'from @a2ui/web_core.'
    : 'no component with this id exists on the surface.';
  void surface.dispatchError({
    code: 'UNRESOLVED_CHILD_REFERENCE',
    message: `Unresolved child reference '${id}' at '${requestedPath}': ${detail}`,
  });
}
