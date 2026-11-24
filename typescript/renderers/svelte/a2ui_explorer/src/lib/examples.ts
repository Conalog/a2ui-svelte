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

/** The examples the explorer shows: the official basic catalog examples plus Svelte ones. */

import type {ProcessableMessage} from '@a2ui/web_core';

export type ProtocolVersion = 'v1.0' | 'v0.9';

export interface Example {
  /** The file name without `.json`; stable, used in the URL. */
  readonly id: string;
  readonly version: ProtocolVersion;
  readonly title: string;
  readonly description: string;
  readonly messages: readonly ProcessableMessage[];
}

interface ExampleFile {
  name: string;
  description?: string;
  messages: ProcessableMessage[];
}

const V10_FILES = import.meta.glob<ExampleFile>(
  '../../../../../../catalogs/basic/v1/examples/*.json',
  {eager: true, import: 'default'},
);
const V09_FILES = import.meta.glob<ExampleFile>(
  '../../../../../../catalogs/basic/v0_9/examples/*.json',
  {eager: true, import: 'default'},
);
const SVELTE_FILES = import.meta.glob<ExampleFile>('./examples/*.json', {
  eager: true,
  import: 'default',
});

function toExamples(files: Record<string, ExampleFile>, version: ProtocolVersion): Example[] {
  return Object.entries(files)
    .map(([file, content]) => ({
      id: file.slice(file.lastIndexOf('/') + 1).replace(/\.json$/, ''),
      version,
      title: content.name,
      description: content.description ?? '',
      messages: content.messages,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export const EXAMPLES: Readonly<Record<ProtocolVersion, readonly Example[]>> = {
  'v1.0': [...toExamples(SVELTE_FILES, 'v1.0'), ...toExamples(V10_FILES, 'v1.0')],
  'v0.9': toExamples(V09_FILES, 'v0.9'),
};

export function findExample(version: ProtocolVersion, id: string | null): Example {
  const examples = EXAMPLES[version];
  return examples.find(example => example.id === id) ?? examples[0]!;
}
