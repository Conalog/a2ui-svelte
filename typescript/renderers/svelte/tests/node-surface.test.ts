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

import {act, render, waitFor} from '@testing-library/svelte';
import {describe, expect, it} from 'vitest';

import type {ComponentNode} from '@a2ui/web_core';
import type {A2uiWebComponentElement} from '@a2ui/web_core/universal';

import {A2uiSurface} from '../src/index.js';
import {createFixtureSurface, findElement} from './utils.js';

function nodeOf(element: Element | null): ComponentNode | undefined {
  return (element as A2uiWebComponentElement | null)?.node;
}

describe('A2uiSurface lifecycle', () => {
  it('reports a child reference that names no child, once', async () => {
    const {surface, errors} = createFixtureSurface([{id: 'root', component: 'BrokenParent'}]);

    const {getByTestId, rerender} = render(A2uiSurface, {props: {surface}});
    await waitFor(() => getByTestId('broken-parent'));
    await waitFor(() => expect(errors).toHaveLength(1));
    expect(errors[0]).toMatchObject({code: 'UNRESOLVED_CHILD_REFERENCE'});
    expect(errors[0]?.message).toContain("'missing_child'");

    await rerender({surface});
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(errors).toHaveLength(1);
  });

  it('disposes every node when it unmounts', async () => {
    const {surface} = createFixtureSurface([
      {id: 'root', component: 'Column', children: ['reader', 'text']},
      {id: 'reader', component: 'ContextReader', label: 'Svelte'},
      {id: 'text', component: 'Text', text: 'Universal'},
    ]);

    const {container, unmount} = render(A2uiSurface, {props: {surface}});
    const nodes = [
      nodeOf(await findElement(container, 'a2ui-basic-column')),
      nodeOf(await findElement(container, 'a2ui-svelte-contextreader')),
      nodeOf(await findElement(container, 'a2ui-basic-text')),
    ];
    expect(nodes.every(node => node && !node.disposed)).toBe(true);

    unmount();
    expect(nodes.every(node => node?.disposed)).toBe(true);
    expect(container.children).toHaveLength(0);
  });

  it('renders a new surface from scratch when the surface prop changes', async () => {
    const first = createFixtureSurface([{id: 'root', component: 'ContextReader', label: 'first'}]);
    const second = createFixtureSurface([
      {id: 'root', component: 'ContextReader', label: 'second'},
    ]);

    const {container, rerender, getByTestId} = render(A2uiSurface, {
      props: {surface: first.surface},
    });
    await waitFor(() => expect(getByTestId('context-reader').textContent).toBe('first'));
    const firstRoot = nodeOf(container.querySelector('a2ui-svelte-contextreader'));

    await rerender({surface: second.surface});
    await waitFor(() => expect(getByTestId('context-reader').textContent).toBe('second'));
    expect(firstRoot?.disposed).toBe(true);
  });

  it('keeps Svelte content mounted when a universal container moves its host', async () => {
    const {surface} = createFixtureSurface([
      {id: 'root', component: 'Column', children: ['reader']},
      {id: 'reader', component: 'ContextReader', label: 'moving'},
    ]);

    const {container} = render(A2uiSurface, {props: {surface}});
    const host = await findElement(container, 'a2ui-svelte-contextreader');
    const content = await findElement(host, '[data-testid="context-reader"]');

    // A disconnect and a connect in the same task, as a container's reorder does.
    const parent = host.parentNode!;
    const next = host.nextSibling;
    await act(() => {
      parent.removeChild(host);
      parent.insertBefore(host, next);
    });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(host.querySelector('[data-testid="context-reader"]')).toBe(content);
  });

  it('unmounts Svelte content when its host leaves the document', async () => {
    const {surface, processor} = createFixtureSurface([
      {id: 'root', component: 'Column', children: ['reader']},
      {id: 'reader', component: 'ContextReader', label: 'leaving'},
    ]);

    const {container} = render(A2uiSurface, {props: {surface}});
    const host = await findElement(container, 'a2ui-svelte-contextreader');
    await findElement(host, '[data-testid="context-reader"]');

    await act(() => {
      processor.processMessages([
        {
          version: '1.0',
          updateComponents: {
            surfaceId: 's1',
            components: [{id: 'root', component: 'Column', children: []}],
          },
        },
      ]);
    });
    await waitFor(() => expect(host.isConnected).toBe(false));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(host.querySelector('[data-testid="context-reader"]')).toBeNull();
  });
});
