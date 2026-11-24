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

import {render, waitFor} from '@testing-library/svelte';
import {describe, expect, it} from 'vitest';

import {A2uiSurface} from '../src/index.js';
import {createFixtureSurface, findElement} from './utils.js';

describe('Svelte host elements and accessibility', () => {
  it('label the element an implementation attaches with accessibilityRef', async () => {
    const {surface} = createFixtureSurface([
      {
        id: 'root',
        component: 'CustomInput',
        label: 'Name',
        value: {'@path': '/name'},
        '@accessibility': {label: 'Full name', description: 'As on your passport'},
      },
    ]);

    const {container} = render(A2uiSurface, {props: {surface}});
    const input = await findElement(container, 'input');
    await waitFor(() => expect(input.getAttribute('aria-label')).toBe('Full name'));
    expect(input.getAttribute('aria-description')).toBe('As on your passport');
    const host = container.querySelector('a2ui-svelte-custominput')!;
    expect(host.getAttribute('role')).toBeNull();
    expect(host.getAttribute('aria-label')).toBeNull();
  });

  it('label the host as a group when the implementation attaches nothing', async () => {
    const {surface} = createFixtureSurface([
      {
        id: 'root',
        component: 'ContextReader',
        label: 'visible',
        '@accessibility': {label: 'Reader', live: 'polite'},
      },
    ]);

    const {container} = render(A2uiSurface, {props: {surface}});
    const host = await findElement(container, 'a2ui-svelte-contextreader');
    await waitFor(() => expect(host.getAttribute('aria-label')).toBe('Reader'));
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-live')).toBe('polite');
  });

  it('hide the host and its subtree from assistive technology', async () => {
    const {surface} = createFixtureSurface([
      {id: 'root', component: 'ContextReader', label: 'secret', '@accessibility': {hidden: true}},
    ]);

    const {container} = render(A2uiSurface, {props: {surface}});
    const host = await findElement(container, 'a2ui-svelte-contextreader');
    await waitFor(() => expect(host.getAttribute('aria-hidden')).toBe('true'));
    expect(host.hasAttribute('inert')).toBe(true);
  });

  it('mark a failing check as invalid and point at its messages', async () => {
    const {processor, surface} = createFixtureSurface(
      [
        {
          id: 'root',
          component: 'CustomInput',
          label: 'Email',
          value: {'@path': '/email'},
          '@checks': [
            {
              condition: {'@call': 'email', args: {value: {'@path': '/email'}}},
              message: 'Enter a valid email address.',
            },
          ],
        },
      ],
      {dataModel: {email: 'not an email'}},
    );

    const {container, getByTestId} = render(A2uiSurface, {props: {surface}});
    const input = await findElement(container, 'input');
    const errors = await waitFor(() => getByTestId('custom-input-errors'));
    expect(errors.textContent).toContain('Enter a valid email address.');
    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(errors.id).not.toBe('');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(errors.id);

    processor.processMessages([
      {
        version: '1.0',
        updateDataModel: {surfaceId: 's1', path: '/email', value: 'ada@example.com'},
      },
    ]);
    await waitFor(() => expect(input.hasAttribute('aria-invalid')).toBe(false));
    expect(container.querySelector('[data-testid="custom-input-errors"]')).toBeNull();
  });
});
