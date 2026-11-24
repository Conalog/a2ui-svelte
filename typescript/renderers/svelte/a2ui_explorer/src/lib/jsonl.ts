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

/**
 * Reads A2UI messages from a JSON Lines response, one message per line, as
 * they arrive. A2UI is transport-agnostic and the renderer contains no
 * transport code; this is how this application reads its agent.
 */
export async function* readJsonLines(response: Response): AsyncGenerator<unknown> {
  if (!response.body) return;
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffered = '';
  for (;;) {
    const {done, value} = await reader.read();
    if (value) buffered += value;
    let newline = buffered.indexOf('\n');
    while (newline >= 0) {
      const line = buffered.slice(0, newline).trim();
      buffered = buffered.slice(newline + 1);
      if (line) yield JSON.parse(line);
      newline = buffered.indexOf('\n');
    }
    if (done) break;
  }
  const rest = buffered.trim();
  if (rest) yield JSON.parse(rest);
}
