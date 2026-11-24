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

import {describe, expect, it} from 'vitest';
import {z} from 'zod';

import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
import {isWebComponentImplementation} from '@a2ui/web_core/universal';
import {CommonSchemas} from '@a2ui/web_core/v1_0';

import {toWebComponent} from '../src/catalog/to_web_component.js';
import {createComponentImplementation} from '../src/index.js';
import ContextReader from './fixtures/ContextReader.svelte';

/** The props `ContextReader` reads. */
const readerSchema = z.object({label: CommonSchemas.DynamicString.optional()});

describe('toWebComponent', () => {
  it('wraps a Svelte implementation in a host element named after it', () => {
    const implementation = createComponentImplementation(
      {name: 'StatusBadge', schema: readerSchema},
      ContextReader,
    );
    const entry = toWebComponent(implementation);

    expect(isWebComponentImplementation(entry)).toBe(true);
    expect(entry.tagName).toBe('a2ui-svelte-statusbadge');
    expect(entry.name).toBe('StatusBadge');
    expect(entry.schema).toBe(implementation.schema);
  });

  it('returns the same wrapper for the same implementation', () => {
    const implementation = createComponentImplementation(
      {name: 'Gauge', schema: readerSchema},
      ContextReader,
    );
    expect(toWebComponent(implementation)).toBe(toWebComponent(implementation));
  });

  it('gives two implementations with one name their own tag and element class', () => {
    const first = toWebComponent(
      createComponentImplementation({name: 'Chip', schema: readerSchema}, ContextReader),
    );
    const second = toWebComponent(
      createComponentImplementation({name: 'Chip', schema: readerSchema}, ContextReader),
    );
    expect(first.tagName).toBe('a2ui-svelte-chip');
    expect(second.tagName).toBe('a2ui-svelte-chip-2');
    expect(first.element).not.toBe(second.element);
  });

  it('returns a universal element entry as it is', () => {
    const text = basicCatalog.components.get('Text')!;
    expect(toWebComponent(text)).toBe(text);
  });
});

describe('createComponentImplementation', () => {
  it('keeps the composition constraints and catalog metadata of the API', () => {
    const implementation = createComponentImplementation(
      {
        name: 'Panel',
        schema: readerSchema,
        allowedParents: ['Surface', 'Column'],
        allowedChildren: ['Text'],
        metadata: {extensions: {hint: 'panel'}},
      },
      ContextReader,
    );
    expect(implementation.allowedParents).toEqual(['Surface', 'Column']);
    expect(implementation.allowedChildren).toEqual(['Text']);
    expect(implementation.metadata).toEqual({extensions: {hint: 'panel'}});
    expect(implementation.component).toBe(ContextReader);
  });

  it('copies only the API fields of a richer entry', () => {
    const implementation = createComponentImplementation(
      basicCatalog.components.get('Text')!,
      ContextReader,
    );
    expect(isWebComponentImplementation(implementation)).toBe(false);
    expect('tagName' in implementation).toBe(false);
  });
});
