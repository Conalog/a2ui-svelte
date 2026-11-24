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
 * Copies the conformance suites and example payloads the Svelte renderer
 * tests against from a checkout of the official A2UI repository, into the
 * same relative paths, and records the commit in conformance/VENDORED.md.
 *
 * Usage: node scripts/sync-official.mjs <path-to-a2ui-checkout>
 */

import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Paths relative to the repository root; a directory is copied whole. */
const VENDORED_PATHS = [
  'conformance/core/adapter_conformance.yaml',
  'conformance/core/accessibility.yaml',
  'conformance/adapter/adapter_conformance_v0_9.yaml',
  'conformance/e2e',
  'catalogs/basic/v1/catalog.json',
  'catalogs/basic/v1/examples',
  'catalogs/basic/v0_9/catalog.json',
  'catalogs/basic/v0_9/examples',
  'catalogs/basic/v0_9_1/catalog.json',
];

function main() {
  const source = process.argv[2];
  if (!source) {
    console.error('Usage: node scripts/sync-official.mjs <path-to-a2ui-checkout>');
    process.exit(2);
  }
  const sourceRoot = path.resolve(source);
  const commit = git(sourceRoot, 'rev-parse', 'HEAD');
  const commitDate = git(sourceRoot, 'show', '-s', '--format=%cs', 'HEAD');

  const copied = [];
  for (const relPath of VENDORED_PATHS) {
    const from = path.join(sourceRoot, relPath);
    const to = path.join(REPO_ROOT, relPath);
    if (!fs.existsSync(from)) {
      throw new Error(`${relPath} does not exist in ${sourceRoot}`);
    }
    fs.rmSync(to, {recursive: true, force: true});
    fs.mkdirSync(path.dirname(to), {recursive: true});
    fs.cpSync(from, to, {recursive: true});
    const files = listFiles(to);
    // A Windows checkout may have CRLF line endings; the repository stores LF.
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (text.includes('\r\n')) fs.writeFileSync(file, text.replaceAll('\r\n', '\n'));
    }
    copied.push(...files.map(file => path.relative(REPO_ROOT, file).replaceAll('\\', '/')));
  }

  writeManifest(commit, commitDate, copied.sort());
  console.log(`Copied ${copied.length} files from a2ui-project/a2ui@${commit.slice(0, 12)}.`);
}

function git(cwd, ...args) {
  return execFileSync('git', args, {cwd, encoding: 'utf8'}).trim();
}

function listFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs
    .readdirSync(target, {withFileTypes: true})
    .flatMap(entry => listFiles(path.join(target, entry.name)));
}

function writeManifest(commit, commitDate, files) {
  const lines = [
    '# Files copied from the official A2UI repository',
    '',
    'The files listed below are copied unchanged from',
    `[a2ui-project/a2ui](https://github.com/a2ui-project/a2ui) at commit`,
    `[\`${commit.slice(0, 12)}\`](https://github.com/a2ui-project/a2ui/tree/${commit}) (${commitDate}).`,
    'They are licensed under the Apache License, Version 2.0, by their authors.',
    '',
    'They sit at the same paths as in the official repository, so the tests find',
    'them the same way here and upstream. Do not edit them here; update them with:',
    '',
    '```sh',
    'node scripts/sync-official.mjs <path-to-a2ui-checkout>',
    '```',
    '',
    '## Files',
    '',
    ...files.map(file => `- \`${file}\``),
    '',
  ];
  fs.writeFileSync(path.join(REPO_ROOT, 'conformance/VENDORED.md'), lines.join('\n'));
}

main();
