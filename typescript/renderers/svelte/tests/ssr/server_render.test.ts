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

import {render} from 'svelte/server';
import {describe, expect, it} from 'vitest';

import {MessageProcessor} from '@a2ui/web_core';
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';

import {A2uiSurface, type SvelteCatalogComponent} from '../../src/index.js';

describe('server-side rendering', () => {
  it('renders an empty surface and creates no resolver', () => {
    const processor = new MessageProcessor<SvelteCatalogComponent>([basicCatalog]);
    processor.processMessages([
      {
        version: '1.0',
        createSurface: {
          surfaceId: 'ssr',
          catalogId: basicCatalog.id,
          components: [{id: 'root', component: 'Text', text: 'Rendered on the client'}],
        },
      },
    ]);
    const surface = processor.model.getSurface('ssr')!;

    const {body} = render(A2uiSurface, {props: {surface}});

    expect(body).not.toContain('Rendered on the client');
    expect(body).not.toContain('a2ui-');
  });
});
