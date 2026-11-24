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
 * Which elements Svelte rendered, with their Svelte context and error channel.
 *
 * A universal element (a Lit `Column`, say) renders its own children. When one
 * of them is a Svelte implementation, the element creates its host itself, and
 * the host mounts the Svelte content with the context of the nearest element
 * above it that Svelte rendered. The Svelte content then reads the same
 * context it would read if Svelte had rendered it directly, and its errors
 * reach the same error boundaries.
 */

/**
 * Identifies an element that Svelte rendered through `ChildElement`, with the
 * Svelte context at that point in the component tree.
 */
export class HostOwner {
  // Nominal: only `new HostOwner()` is one.
  declare private readonly nominal: never;

  /**
   * @param contexts The Svelte context where `ChildElement` rendered the element.
   * @param reportError Rethrows an error from content mounted below the element
   *     inside `ChildElement`, where the application's error boundaries catch it.
   */
  constructor(
    readonly contexts: Map<unknown, unknown>,
    readonly reportError: (error: unknown) => void,
  ) {}
}

const rendered = new WeakMap<Element, HostOwner>();

/** Records that Svelte rendered `element`, under the identity `owner`. */
export function markSvelteRendered(element: Element, owner: HostOwner): void {
  rendered.set(element, owner);
}

/**
 * Whether Svelte rendered `element`. Svelte renders the content of a host it
 * created as the host's children; only a host another renderer created
 * mounts its content itself.
 */
export function isSvelteRendered(element: Element): boolean {
  return rendered.has(element);
}

/**
 * The owner of the nearest element above `element` that Svelte rendered,
 * crossing shadow roots; `null` when there is none.
 */
export function ownerAbove(element: Element): HostOwner | null {
  let current: Node | null = element.parentNode;
  while (current) {
    const owner = current instanceof Element ? rendered.get(current) : undefined;
    if (owner) return owner;
    current = current instanceof ShadowRoot ? current.host : current.parentNode;
  }
  return null;
}
