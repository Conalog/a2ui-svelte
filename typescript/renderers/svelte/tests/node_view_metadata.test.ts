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
import {afterEach, describe, expect, it} from 'vitest';

import {A2uiSurface} from '../src/index.js';
import {renderLog} from './fixtures/render_log.js';
import {createFixtureSurface} from './utils.js';

afterEach(() => {
  renderLog.length = 0;
});

describe('component, catalog and surface metadata', () => {
  it('reach the component and update it without re-rendering its siblings', async () => {
    const {processor, surface} = createFixtureSurface(
      [
        {id: 'root', component: 'Column', children: ['sibling', 'probe']},
        {id: 'sibling', component: 'TrackedText', text: 'Stable sibling'},
        {
          id: 'probe',
          component: 'MetaProbe',
          label: 'Probe',
          metadata: {extensions: {badge: 'initial'}},
        },
      ],
      {metadata: {extensions: {theme_mode: 'dark'}}},
    );

    const {getByTestId} = render(A2uiSurface, {props: {surface}});
    await waitFor(() =>
      expect(getByTestId('meta-probe').textContent).toBe(
        'Probe|inst:initial|surf:dark|cat:static-v1',
      ),
    );

    const siblingRenders = () => renderLog.filter(entry => entry.componentId === 'sibling').length;
    const before = siblingRenders();

    await act(() => {
      processor.processMessages([
        {
          version: '1.0',
          updateComponents: {
            surfaceId: 's1',
            components: [
              {
                id: 'probe',
                component: 'MetaProbe',
                label: 'Probe',
                metadata: {extensions: {badge: 'updated'}},
              },
            ],
          },
        },
      ]);
    });
    await waitFor(() =>
      expect(getByTestId('meta-probe').textContent).toBe(
        'Probe|inst:updated|surf:dark|cat:static-v1',
      ),
    );

    // The sibling never reads metadata, so a metadata change on it does not re-render it.
    await act(() => {
      surface.componentsModel.get('sibling')!.setExtension('trace_id', 't-99');
    });
    expect(siblingRenders()).toBe(before);

    await act(() => {
      surface.setExtension('theme_mode', 'light');
    });
    await waitFor(() =>
      expect(getByTestId('meta-probe').textContent).toBe(
        'Probe|inst:updated|surf:light|cat:static-v1',
      ),
    );
  });
});
