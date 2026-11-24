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

import {describe, expect, it, vi} from 'vitest';

describe('import without a DOM', () => {
  it('has no HTMLElement in this environment', () => {
    expect(typeof HTMLElement).toBe('undefined');
  });

  it.each([
    ['the package', () => import('../../src/index.js')],
    ['the host element module', () => import('../../src/catalog/svelte_host_element.svelte.js')],
    ['the Markdown host module', () => import('../../src/markdown_hosts.js')],
  ])('loads %s', async (_name, load) => {
    vi.resetModules();
    await expect(load()).resolves.toBeDefined();
  });
});
