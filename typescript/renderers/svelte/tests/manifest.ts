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

/** Writes executed-case manifest records for the official conformance comparer (Node only). */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {ManifestRecord} from './adapter_harness.js';

export function writeManifestRecord(rec: ManifestRecord): void {
  const manifestDir = process.env.A2UI_CONFORMANCE_MANIFEST_DIR;
  if (!manifestDir) {
    return;
  }
  fs.mkdirSync(manifestDir, {recursive: true});
  const filePath = path.join(manifestDir, `${rec.harness}-${process.pid}.jsonl`);
  const payload: Record<string, string> = {
    harness: rec.harness,
    suite: rec.suite.replaceAll('\\', '/'),
    case: rec.case,
    status: rec.status,
  };
  if (rec.reason) {
    payload.reason = rec.reason;
  }
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}
