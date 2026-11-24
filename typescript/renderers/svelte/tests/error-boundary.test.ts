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

import SurfaceInBoundary from './fixtures/SurfaceInBoundary.svelte';
import {createFixtureSurface, findElement} from './utils.js';

describe('error boundaries around A2uiSurface', () => {
  it('catch an error from a Svelte component the surface renders directly', async () => {
    const {surface} = createFixtureSurface([{id: 'root', component: 'Thrower', label: 'fail'}]);

    const {container} = render(SurfaceInBoundary, {props: {surface}});
    const failed = await findElement(container, '[data-testid="boundary-failed"]');
    expect(failed.textContent).toBe('Thrower failed to render');
  });

  it('catch an error from a Svelte component inside a basic catalog container', async () => {
    const {surface} = createFixtureSurface([
      {id: 'root', component: 'Column', children: ['ok', 'bad']},
      {id: 'ok', component: 'Text', text: 'Fine'},
      {id: 'bad', component: 'Thrower', label: 'fail'},
    ]);

    const {container} = render(SurfaceInBoundary, {props: {surface}});
    const failed = await findElement(container, '[data-testid="boundary-failed"]');
    expect(failed.textContent).toBe('Thrower failed to render');
    expect(container.querySelector('a2ui-basic-column')).toBeNull();
  });

  it('leave the surface alone while nothing fails', async () => {
    const {surface} = createFixtureSurface([
      {id: 'root', component: 'Column', children: ['good']},
      {id: 'good', component: 'Thrower', label: 'fine'},
    ]);

    const {container} = render(SurfaceInBoundary, {props: {surface}});
    await waitFor(() => expect(container.textContent).toContain('fine'));
    expect(container.querySelector('[data-testid="boundary-failed"]')).toBeNull();
  });
});
