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

import {getContext, setContext} from 'svelte';
import type {MarkdownRenderer} from '@a2ui/web_core';

const MARKDOWN_KEY = Symbol('a2ui.markdown');

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
