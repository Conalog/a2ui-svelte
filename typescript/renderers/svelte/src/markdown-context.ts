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

import {type Component, getContext, setContext} from 'svelte';
import type {MarkdownRenderer} from '@a2ui/web_core';

const MARKDOWN_KEY = Symbol('a2ui.markdown');
export const MARKDOWN_COMPONENT_KEY = Symbol('a2ui.markdownComponent');

/**
 * Gives the components below the caller a Markdown renderer: a function that
 * returns sanitized HTML, such as `renderMarkdown` from `@a2ui/markdown-it`.
 * An `A2uiSurface` below the caller also hands it to the basic catalog's
 * `Text`. Call it while a component initializes, as with any Svelte context.
 */
export function setMarkdownContext(renderer: MarkdownRenderer | undefined): void {
  setContext(MARKDOWN_KEY, renderer);
}

/** The Markdown renderer set above the caller with `setMarkdownContext`, if any. */
export function getMarkdownContext(): MarkdownRenderer | undefined {
  return getContext<MarkdownRenderer | undefined>(MARKDOWN_KEY);
}

/** What the component given to `setMarkdownComponentContext` receives. */
export interface MarkdownComponentProps {
  /** The Markdown source to render, as the agent sent it. */
  markdown: string;
}

/**
 * Renders the Markdown of the basic catalog's `Text` with a Svelte component
 * instead of a function that returns HTML. The component renders inside the
 * application's Svelte tree, below the `A2uiSurface` that shows the `Text`, so
 * it reads the application's context. When both this and `setMarkdownContext`
 * are set, this one is used.
 *
 * The basic catalog's `Text` reads one Markdown renderer for the whole page, so
 * set the component above every `A2uiSurface` on the page or above none: a
 * surface without it shows no text for its Markdown while another surface has
 * it.
 */
export function setMarkdownComponentContext(
  component: Component<MarkdownComponentProps> | undefined,
): void {
  setContext(MARKDOWN_COMPONENT_KEY, component);
}

/** The Markdown component set above the caller with `setMarkdownComponentContext`, if any. */
export function getMarkdownComponentContext(): Component<MarkdownComponentProps> | undefined {
  return getContext<Component<MarkdownComponentProps> | undefined>(MARKDOWN_COMPONENT_KEY);
}
