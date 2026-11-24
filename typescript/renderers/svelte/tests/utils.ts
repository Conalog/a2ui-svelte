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

/** Builds surfaces for the unit tests from the basic catalog plus the Svelte fixtures. */

import {waitFor} from '@testing-library/svelte';
import {z} from 'zod';

import {
  type A2uiErrorPayload,
  type ActionPayload,
  Catalog,
  MessageProcessor,
  type ProcessableMessage,
} from '@a2ui/web_core';
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
import {CommonSchemas} from '@a2ui/web_core/v1_0';

import {createComponentImplementation, type SvelteCatalogComponent} from '../src/index.js';
import BrokenParent from './fixtures/BrokenParent.svelte';
import ContextReader from './fixtures/ContextReader.svelte';
import CustomInput from './fixtures/CustomInput.svelte';
import MetaProbe from './fixtures/MetaProbe.svelte';
import TrackedText from './fixtures/TrackedText.svelte';

export const FIXTURE_CATALOG_ID = 'https://example.com/svelte_fixtures_v1_0.json';

export const fixtureImplementations = {
  BrokenParent: createComponentImplementation(
    {name: 'BrokenParent', schema: z.object({})},
    BrokenParent,
  ),
  ContextReader: createComponentImplementation(
    {name: 'ContextReader', schema: z.object({label: CommonSchemas.DynamicString.optional()})},
    ContextReader,
  ),
  CustomInput: createComponentImplementation(
    {
      name: 'CustomInput',
      schema: z
        .object({
          label: CommonSchemas.DynamicString.optional(),
          value: CommonSchemas.DynamicString,
        })
        .merge(CommonSchemas.Checkable),
    },
    CustomInput,
  ),
  MetaProbe: createComponentImplementation(
    {
      name: 'MetaProbe',
      schema: z.object({label: CommonSchemas.DynamicString.optional()}),
      metadata: {extensions: {catalog_hint: 'static-v1'}},
    },
    MetaProbe,
  ),
  TrackedText: createComponentImplementation(
    {name: 'TrackedText', schema: z.object({text: CommonSchemas.DynamicString.optional()})},
    TrackedText,
  ),
};

/** The basic catalog plus the Svelte fixtures, as one v1.0 catalog. */
export function createFixtureCatalog(): Catalog<SvelteCatalogComponent> {
  return new Catalog<SvelteCatalogComponent>(
    FIXTURE_CATALOG_ID,
    '1.0',
    [...basicCatalog.components.values(), ...Object.values(fixtureImplementations)],
    [...basicCatalog.functions.values()],
  );
}

/** A surface `s1` holding `components`, with its actions and errors collected. */
export function createFixtureSurface(
  components: Array<Record<string, unknown>>,
  options: {dataModel?: Record<string, unknown>; metadata?: Record<string, unknown>} = {},
) {
  const actions: ActionPayload[] = [];
  const errors: A2uiErrorPayload[] = [];
  const processor = new MessageProcessor<SvelteCatalogComponent>(
    [createFixtureCatalog()],
    action => {
      actions.push(action);
    },
  );
  processor.processMessages([
    {
      version: '1.0',
      createSurface: {
        surfaceId: 's1',
        catalogId: FIXTURE_CATALOG_ID,
        ...(options.dataModel ? {dataModel: options.dataModel} : {}),
        ...(options.metadata ? {metadata: options.metadata} : {}),
        components,
      },
    } as ProcessableMessage,
  ]);
  const surface = processor.model.getSurface('s1');
  if (!surface) throw new Error('surface s1 was not created');
  surface.onError.subscribe(error => {
    errors.push(error);
  });
  return {processor, surface, actions, errors};
}

/** Waits until `selector` matches an element under `root`, and returns it. */
export async function findElement<T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
): Promise<T> {
  return waitFor(() => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`No element matches ${selector}`);
    return element;
  });
}
