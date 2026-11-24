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
 * Checks that every source file the repository owns starts with the Apache-2.0
 * license header. Files copied from the official A2UI repository keep their own
 * headers and are skipped.
 *
 * Usage: node scripts/check-license-headers.mjs
 */

import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKED_EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.svelte', '.yml', '.yaml']);
const SKIPPED_PREFIXES = ['conformance/', 'catalogs/', '.yarn/'];
const REQUIRED_LINES = [
  /Copyright \d{4} The a2ui-svelte Authors/,
  /Licensed under the Apache License, Version 2\.0/,
];

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
})
  .split('\n')
  .filter(file => file && CHECKED_EXTENSIONS.has(path.extname(file)))
  .filter(file => !SKIPPED_PREFIXES.some(prefix => file.startsWith(prefix)));

const missing = files.filter(file => {
  const head = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8').slice(0, 1200);
  return !REQUIRED_LINES.every(pattern => pattern.test(head));
});

if (missing.length > 0) {
  console.error(`These files lack the license header:\n${missing.map(f => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`License headers present in ${files.length} files.`);
