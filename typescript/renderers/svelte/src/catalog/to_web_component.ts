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

import type {ZodTypeAny} from 'zod';
import {
  isWebComponentImplementation,
  type WebComponentImplementation,
} from '@a2ui/web_core/universal';
import type {SvelteComponentImplementation} from '../svelte_component_implementation.js';
import {SvelteWcHost} from './svelte_host_element.svelte.js';

const hosted = new WeakMap<SvelteComponentImplementation, WebComponentImplementation>();
const tagNameCounts = new Map<string, number>();

/**
 * `a2ui-svelte-<name>`, with an incrementing suffix (`-2`, ...) when two
 * different implementations share a component name.
 */
function computeTagName(name: string): string {
  const baseTagName = `a2ui-svelte-${name.toLowerCase()}`;
  const count = (tagNameCounts.get(baseTagName) ?? 0) + 1;
  tagNameCounts.set(baseTagName, count);
  return count === 1 ? baseTagName : `${baseTagName}-${count}`;
}

/**
 * The web component form of a Svelte catalog entry: the entry itself plus the
 * host element it renders inside (`tagName`, `element`), one per entry. An
 * entry that already names an element is returned as is. The element is not
 * defined in `customElements` here; the renderer defines it with
 * `registerUniversalElement` when it renders it.
 */
export function toWebComponent<Schema extends ZodTypeAny = ZodTypeAny>(
  implementation: SvelteComponentImplementation<Schema> | WebComponentImplementation<Schema>,
): WebComponentImplementation<Schema> {
  if (isWebComponentImplementation(implementation)) {
    return implementation;
  }

  const cached = hosted.get(implementation);
  if (cached) {
    return cached as WebComponentImplementation<Schema>;
  }

  const entry: WebComponentImplementation<Schema> & SvelteComponentImplementation<Schema> = {
    ...implementation,
    tagName: computeTagName(implementation.name),
    // `customElements` refuses to define one class under two tag names.
    element: class extends SvelteWcHost {},
  };

  hosted.set(implementation, entry);
  return entry;
}
