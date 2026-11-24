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

import * as root from '../src/index.js';

describe('package exports', () => {
  it('exports exactly the documented runtime API', () => {
    expect(Object.keys(root).sort()).toEqual([
      'A2uiSurface',
      'createComponentImplementation',
      'fromSignal',
      'getA2uiSurface',
      'getMarkdownComponentContext',
      'getMarkdownContext',
      'setMarkdownComponentContext',
      'setMarkdownContext',
    ]);
  });
});
