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

import {fireEvent, render, waitFor} from '@testing-library/svelte';
import {afterEach, describe, expect, it} from 'vitest';
import {z} from 'zod';

import {
  type ActionPayload,
  Catalog,
  MessageProcessor,
  type ProcessableMessage,
} from '@a2ui/web_core';
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
import {CommonSchemas} from '@a2ui/web_core/v1_0';

import {
  A2uiSurface,
  createComponentImplementation,
  type SvelteCatalogComponent,
} from '../src/index.js';
import ContextReader from './fixtures/ContextReader.svelte';
import CustomButton from './fixtures/CustomButton.svelte';
import CustomContainer from './fixtures/CustomContainer.svelte';
import CustomInput from './fixtures/CustomInput.svelte';
import {renderLog} from './fixtures/render_log.js';
import SurfaceWithContext from './fixtures/SurfaceWithContext.svelte';
import TrackedText from './fixtures/TrackedText.svelte';

const CUSTOM_CATALOG_ID = 'https://example.com/svelte_v1_0.json';

const CustomContainerImpl = createComponentImplementation(
  {
    name: 'CustomContainer',
    schema: z.object({
      title: CommonSchemas.DynamicString.optional(),
      child: CommonSchemas.ComponentId,
    }),
  },
  CustomContainer,
);

const ContextReaderImpl = createComponentImplementation(
  {name: 'ContextReader', schema: z.object({label: CommonSchemas.DynamicString.optional()})},
  ContextReader,
);

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

const CustomButtonImpl = createComponentImplementation(
  {
    name: 'CustomButton',
    schema: z.object({
      label: CommonSchemas.DynamicString.optional(),
      action: CommonSchemas.Action,
    }),
  },
  CustomButton,
);

const TrackedTextImpl = createComponentImplementation(
  {name: 'TrackedText', schema: z.object({text: CommonSchemas.DynamicString.optional()})},
  TrackedText,
);

/** The basic catalog plus the Svelte fixtures, as one v1.0 catalog. */
function createMixedCatalog(): Catalog<SvelteCatalogComponent> {
  return new Catalog<SvelteCatalogComponent>(
    CUSTOM_CATALOG_ID,
    '1.0',
    [
      ...basicCatalog.components.values(),
      CustomContainerImpl,
      ContextReaderImpl,
      CustomInputImpl,
      CustomButtonImpl,
      TrackedTextImpl,
    ],
    [...basicCatalog.functions.values()],
  );
}

function createSurface(
  components: Array<Record<string, unknown>>,
  options: {dataModel?: Record<string, unknown>; onAction?: (action: ActionPayload) => void} = {},
) {
  const processor = new MessageProcessor<SvelteCatalogComponent>(
    [createMixedCatalog()],
    options.onAction,
  );
  processor.processMessages([
    {
      version: '1.0',
      createSurface: {
        surfaceId: 's1',
        catalogId: CUSTOM_CATALOG_ID,
        ...(options.dataModel ? {dataModel: options.dataModel} : {}),
        components,
      },
    } as ProcessableMessage,
  ]);
  const surface = processor.model.getSurface('s1');
  if (!surface) throw new Error('surface s1 was not created');
  return {processor, surface};
}

afterEach(() => {
  renderLog.length = 0;
});

describe('A2uiSurface with the v1.0 basic catalog', () => {
  it('renders a surface and follows data model updates', async () => {
    const {processor, surface} = createSurface(
      [
        {id: 'root', component: 'Column', children: ['greeting']},
        {id: 'greeting', component: 'Text', text: {'@path': '/greeting'}},
      ],
      {dataModel: {greeting: 'Hello from Svelte'}},
    );

    const {container} = render(A2uiSurface, {props: {surface}});
    await waitFor(() => expect(container.textContent).toContain('Hello from Svelte'));
    expect(container.querySelector('a2ui-basic-column')).not.toBeNull();

    processor.processMessages([
      {version: '1.0', updateDataModel: {surfaceId: 's1', path: '/greeting', value: 'Updated'}},
    ]);
    await waitFor(() => expect(container.textContent).toContain('Updated'));
  });

  it('renders nothing until the root component arrives', async () => {
    const processor = new MessageProcessor<SvelteCatalogComponent>([createMixedCatalog()]);
    processor.processMessages([
      {version: '1.0', createSurface: {surfaceId: 's1', catalogId: CUSTOM_CATALOG_ID}},
    ]);
    const surface = processor.model.getSurface('s1')!;

    const {container} = render(A2uiSurface, {props: {surface}});
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.children).toHaveLength(0);

    processor.processMessages([
      {
        version: '1.0',
        updateComponents: {
          surfaceId: 's1',
          components: [{id: 'root', component: 'Text', text: 'Arrived'}],
        },
      },
    ]);
    await waitFor(() => expect(container.textContent).toContain('Arrived'));
  });
});

describe('Svelte component implementations', () => {
  it('nest in either order with universal elements', async () => {
    const {surface} = createSurface([
      {id: 'root', component: 'Card', child: 'column'},
      {id: 'column', component: 'Column', children: ['box']},
      {id: 'box', component: 'CustomContainer', title: 'Svelte box', child: 'inner'},
      {id: 'inner', component: 'Text', text: 'Universal text inside Svelte'},
    ]);

    const {container, getByTestId} = render(A2uiSurface, {props: {surface}});
    await waitFor(() => {
      const box = getByTestId('custom-container');
      expect(box.textContent).toContain('Svelte box');
      expect(box.textContent).toContain('Universal text inside Svelte');
    });
    const host = container.querySelector('a2ui-svelte-customcontainer');
    expect(host).not.toBeNull();
    expect(host?.closest('a2ui-basic-column')).not.toBeNull();
  });

  it('read the application context through a universal container', async () => {
    const {surface} = createSurface([
      {id: 'root', component: 'Column', children: ['reader']},
      {id: 'reader', component: 'ContextReader', label: 'context'},
    ]);

    const {getByTestId} = render(SurfaceWithContext, {
      props: {surface, contexts: {'app-theme': 'dark'}},
    });
    await waitFor(() => expect(getByTestId('context-reader').dataset['theme']).toBe('dark'));
  });

  it('write through the binding setter and update dependent components', async () => {
    const {surface} = createSurface(
      [
        {id: 'root', component: 'Column', children: ['input', 'echo']},
        {id: 'input', component: 'CustomInput', label: 'Name', value: {'@path': '/name'}},
        {id: 'echo', component: 'Text', text: {'@path': '/name'}},
      ],
      {dataModel: {name: 'Ada'}},
    );

    const {container, getByTestId} = render(A2uiSurface, {props: {surface}});
    const input = await waitFor(() => getByTestId('custom-input') as HTMLInputElement);
    expect(input.value).toBe('Ada');

    await fireEvent.input(input, {target: {value: 'Grace'}});
    expect(surface.dataModel.get('/name')).toBe('Grace');
    await waitFor(() => expect(container.textContent).toContain('Grace'));
    expect(getByTestId('custom-input')).toBe(input);
  });

  it('dispatch event actions with the resolved context', async () => {
    const actions: ActionPayload[] = [];
    const {surface} = createSurface(
      [
        {
          id: 'root',
          component: 'CustomButton',
          label: 'Send',
          action: {event: {name: 'submit', context: {name: {'@path': '/name'}}}},
        },
      ],
      {dataModel: {name: 'Ada'}, onAction: action => actions.push(action)},
    );

    const {getByTestId} = render(A2uiSurface, {props: {surface}});
    const button = await waitFor(() => getByTestId('custom-button'));
    await fireEvent.click(button);

    await waitFor(() => expect(actions).toHaveLength(1));
    expect(actions[0]).toMatchObject({
      name: 'submit',
      surfaceId: 's1',
      sourceComponentId: 'root',
      context: {name: 'Ada'},
    });
  });

  it('re-render only the component whose data changed', async () => {
    const {processor, surface} = createSurface(
      [
        {id: 'root', component: 'Column', children: ['first', 'second']},
        {id: 'first', component: 'TrackedText', text: {'@path': '/first'}},
        {id: 'second', component: 'TrackedText', text: {'@path': '/second'}},
      ],
      {dataModel: {first: 'one', second: 'two'}},
    );

    const {getByTestId} = render(A2uiSurface, {props: {surface}});
    await waitFor(() => expect(getByTestId('tracked-second').textContent).toBe('two'));
    const before = renderLog.length;

    processor.processMessages([
      {version: '1.0', updateDataModel: {surfaceId: 's1', path: '/first', value: 'uno'}},
    ]);
    await waitFor(() => expect(getByTestId('tracked-first').textContent).toBe('uno'));

    expect(renderLog.slice(before)).toEqual([{componentId: 'first', text: 'uno'}]);
  });
});
