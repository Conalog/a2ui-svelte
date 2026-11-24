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
 * Typing into a control sends each keystroke through the data model and back
 * into the view. The input keeps focus, its caret and its element throughout,
 * also when an unrelated update arrives from the agent while the user types.
 */

import {render, waitFor} from '@testing-library/svelte';
import {describe, expect, it} from 'vitest';
import {userEvent} from 'vitest/browser';
import {z} from 'zod';

import {Catalog, MessageProcessor, type ProcessableMessage} from '@a2ui/web_core';
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
import {CommonSchemas} from '@a2ui/web_core/v1_0';

import {
  A2uiSurface,
  createComponentImplementation,
  type SvelteCatalogComponent,
} from '../../src/index.js';
import CustomInput from '../fixtures/CustomInput.svelte';

const CATALOG_ID = 'https://example.com/input_state.json';

const CustomInputImpl = createComponentImplementation(
  {
    name: 'CustomInput',
    schema: z.object({
      label: CommonSchemas.DynamicString.optional(),
      value: CommonSchemas.DynamicString,
    }),
  },
  CustomInput,
);

function renderForm(input: Record<string, unknown>) {
  const processor = new MessageProcessor<SvelteCatalogComponent>([
    new Catalog<SvelteCatalogComponent>(
      CATALOG_ID,
      '1.0',
      [...basicCatalog.components.values(), CustomInputImpl],
      [...basicCatalog.functions.values()],
    ),
  ]);
  processor.processMessages([
    {
      version: '1.0',
      createSurface: {
        surfaceId: 'form',
        catalogId: CATALOG_ID,
        dataModel: {name: 'Ada Lovelace', status: 'idle'},
        components: [
          {id: 'root', component: 'Column', children: ['field', 'echo', 'status']},
          {id: 'field', value: {'@path': '/name'}, ...input},
          {id: 'echo', component: 'Text', text: {'@path': '/name'}},
          {id: 'status', component: 'Text', text: {'@path': '/status'}},
        ],
      },
    } as ProcessableMessage,
  ]);
  const surface = processor.model.getSurface('form')!;
  const rendered = render(A2uiSurface, {props: {surface}});
  return {processor, surface, rendered};
}

async function findInput(container: HTMLElement): Promise<HTMLInputElement> {
  return waitFor(() => {
    const input = container.querySelector<HTMLInputElement>(
      'a2ui-svelte-custominput input, a2ui-basic-textfield input',
    );
    if (!input) throw new Error('input not rendered yet');
    return input;
  });
}

describe.each([
  ['a Svelte component', {component: 'CustomInput', label: 'Name'}],
  ['the basic catalog TextField', {component: 'TextField', label: 'Name'}],
])('typing into %s', (_label, input) => {
  it('keeps focus and the caret while each keystroke round-trips', async () => {
    const {surface, rendered} = renderForm(input);
    const field = await findInput(rendered.container);

    field.focus();
    field.setSelectionRange(3, 3); // after "Ada"
    await userEvent.keyboard('h');

    await waitFor(() => expect(surface.dataModel.get('/name')).toBe('Adah Lovelace'));
    await waitFor(() => expect(rendered.container.textContent).toContain('Adah Lovelace'));
    expect(await findInput(rendered.container)).toBe(field);
    expect(document.activeElement === field || field.matches(':focus')).toBe(true);
    expect(field.selectionStart).toBe(4);
    expect(field.selectionEnd).toBe(4);
  });

  it('keeps focus and the caret when an unrelated update arrives mid-typing', async () => {
    const {processor, surface, rendered} = renderForm(input);
    const field = await findInput(rendered.container);

    field.focus();
    field.setSelectionRange(3, 3);
    await userEvent.keyboard('h');
    processor.processMessages([
      {version: '1.0', updateDataModel: {surfaceId: 'form', path: '/status', value: 'saving'}},
    ]);
    await userEvent.keyboard('i');

    await waitFor(() => expect(rendered.container.textContent).toContain('saving'));
    await waitFor(() => expect(surface.dataModel.get('/name')).toBe('Adahi Lovelace'));
    expect(await findInput(rendered.container)).toBe(field);
    expect(document.activeElement === field || field.matches(':focus')).toBe(true);
    expect(field.selectionStart).toBe(5);
  });
});
