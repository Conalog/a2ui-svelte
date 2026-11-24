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

import type {Component} from 'svelte';
import type {ComponentApi, InferredComponentApiSchemaType, ResolveA2uiProps} from '@a2ui/web_core';
import type {
  SvelteA2uiComponentProps,
  SvelteComponentImplementation,
} from './svelte_component_implementation.js';

/**
 * Copies the `ComponentApi` fields of `api`. Spreading `api` instead would also copy fields of a
 * richer entry, such as the `tagName` and `element` of a Web Component implementation, and the
 * surface would then render that element instead of the Svelte component.
 */
function componentApiFields<Api extends ComponentApi>(api: Api): ComponentApi<Api['schema']> {
  return {
    name: api.name,
    schema: api.schema,
    allowedParents: api.allowedParents,
    allowedChildren: api.allowedChildren,
    ...(api.metadata !== undefined ? {metadata: api.metadata} : {}),
  };
}

/**
 * Creates a catalog entry that renders `component` for nodes of the component
 * type `api` describes. The component's `props` are typed from `api.schema`.
 *
 * ```ts
 * const Badge = createComponentImplementation(BadgeApi, BadgeView);
 * const catalog = new Catalog<SvelteCatalogComponent>(id, '1.0', [Badge]);
 * ```
 */
export function createComponentImplementation<Api extends ComponentApi>(
  api: Api,
  component: Component<
    SvelteA2uiComponentProps<ResolveA2uiProps<InferredComponentApiSchemaType<Api>>>
  >,
): SvelteComponentImplementation<Api['schema']> {
  return {
    ...componentApiFields(api),
    component: component as SvelteComponentImplementation['component'],
  };
}
