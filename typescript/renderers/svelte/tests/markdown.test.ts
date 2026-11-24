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
import {afterEach, describe, expect, it} from 'vitest';

import {setMarkdownRenderer} from '@a2ui/web_core/universal';

import MarkdownView from './fixtures/MarkdownView.svelte';
import SurfaceWithContext from './fixtures/SurfaceWithContext.svelte';
import {createFixtureSurface} from './utils.js';

const MARKDOWN = '**Bold** <img src=x onerror="alert(1)"> & "quotes"';

function textSurface() {
  return createFixtureSurface([{id: 'root', component: 'Text', text: MARKDOWN}]).surface;
}

afterEach(() => {
  setMarkdownRenderer(undefined);
});

describe('Markdown in the basic catalog Text', () => {
  it('shows the source as escaped text when no renderer is set', async () => {
    const {container} = render(SurfaceWithContext, {props: {surface: textSurface()}});
    const text = await waitFor(() => {
      const element = container.querySelector('a2ui-basic-text');
      if (!element?.textContent?.includes('Bold')) throw new Error('not rendered yet');
      return element;
    });
    expect(text.textContent).toContain(MARKDOWN);
    expect(text.querySelector('img')).toBeNull();
  });

  it('renders through the renderer set with setMarkdownContext', async () => {
    const renderer = async (markdown: string) =>
      `<em data-testid="rendered">${markdown.length}</em>`;
    const {getByTestId} = render(SurfaceWithContext, {
      props: {surface: textSurface(), markdownRenderer: renderer},
    });
    await waitFor(() => expect(getByTestId('rendered').textContent).toBe(String(MARKDOWN.length)));
  });

  it('renders through the component set with setMarkdownComponentContext', async () => {
    const {getByTestId, container} = render(SurfaceWithContext, {
      props: {
        surface: textSurface(),
        markdownComponent: MarkdownView,
        contexts: {'app-theme': 'dark'},
      },
    });

    const view = await waitFor(() => getByTestId('markdown-view'));
    expect(view.textContent).toBe(MARKDOWN);
    expect(view.dataset['theme']).toBe('dark');
    expect(container.querySelector('img')).toBeNull();
    expect(view.closest('a2ui-svelte-markdown')).not.toBeNull();
  });

  it('gives back the previous renderer when the last surface with a component unmounts', async () => {
    const previous = async (markdown: string) => markdown;
    setMarkdownRenderer(previous);
    const {unmount, getByTestId} = render(SurfaceWithContext, {
      props: {surface: textSurface(), markdownComponent: MarkdownView},
    });
    await waitFor(() => getByTestId('markdown-view'));

    unmount();
    const {getMarkdownRenderer} = await import('@a2ui/web_core/universal');
    expect(getMarkdownRenderer()).toBe(previous);
  });
});
