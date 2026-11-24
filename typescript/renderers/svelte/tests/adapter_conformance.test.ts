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

import * as fs from 'node:fs';
import * as path from 'node:path';

import {act, render} from '@testing-library/svelte';
import * as yaml from 'js-yaml';
import {afterAll, afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {MessageProcessor} from '@a2ui/web_core';
import {A2uiSurface, type SvelteCatalogComponent} from '../src/index.js';
import {
  assertAllUnsupportedMatched,
  assertAxeRules,
  assertKnownAccessibilityCase,
  assertKnownAdapterCase,
  assertNodeAccessibility,
  createDefaultAdapterCatalog,
  findUnsupportedReason,
  mountSurface,
  runStep,
  settleSurfaceDom,
  writeManifestRecord,
  type AccessibilityStep,
  type AccessibilityTestCase,
  type AdapterTestCase,
  type ManifestRecord,
  type RenderedSurface,
} from './adapter_harness.js';

/**
 * The official suites, found by walking up from this file: `conformance/` sits at the
 * repository root here and in the official repository alike.
 */
function findConformanceDir(): string {
  let dir = import.meta.dirname;
  for (;;) {
    const candidate = path.join(dir, 'conformance', 'core');
    if (fs.existsSync(path.join(candidate, 'adapter_conformance.yaml'))) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error('conformance/core/adapter_conformance.yaml not found above this test');
    }
    dir = parent;
  }
}

const CONFORMANCE_DIR = findConformanceDir();

function loadYamlCases<T>(fileName: string): T[] {
  const fullPath = path.join(CONFORMANCE_DIR, fileName);
  return yaml.load(fs.readFileSync(fullPath, 'utf8')) as T[];
}

const pendingManifestByTestName = new Map<string, ManifestRecord>();

afterEach(() => {
  const currentTestName = expect.getState().currentTestName ?? '';
  for (const [key, rec] of pendingManifestByTestName) {
    if (currentTestName.endsWith(key)) {
      writeManifestRecord(rec);
      pendingManifestByTestName.delete(key);
    }
  }
});

const accessibilityCases = loadYamlCases<AccessibilityTestCase>('accessibility.yaml');
const adapterCases = loadYamlCases<AdapterTestCase>('adapter_conformance.yaml');
const adapterV09Cases = yaml.load(
  fs.readFileSync(
    path.resolve(CONFORMANCE_DIR, '../adapter/adapter_conformance_v0_9.yaml'),
    'utf8',
  ),
) as AdapterTestCase[];

afterAll(() => {
  assertAllUnsupportedMatched(accessibilityCases, adapterCases, adapterV09Cases);
});

describe('@conalog/a2ui-svelte Accessibility Conformance (conformance/core/accessibility.yaml)', () => {
  for (const testCase of accessibilityCases) {
    const testTitle = `${testCase.name}: ${testCase.description ?? ''}`;
    it(testTitle, async ctx => {
      const record: ManifestRecord = {
        harness: 'svelte',
        suite: 'core/accessibility.yaml',
        case: testCase.name,
        status: 'failed',
      };
      pendingManifestByTestName.set(testTitle, record);
      let rendered: RenderedSurface | undefined;
      try {
        const steps: AccessibilityStep[] = testCase.steps ?? [
          {
            messages: testCase.messages ?? [],
            assertions: testCase.assertions ?? {},
          },
        ];
        const skipReason = findUnsupportedReason(
          testCase.name,
          steps as unknown as Array<Record<string, unknown>>,
        );
        if (skipReason) {
          record.status = 'skipped';
          record.reason = skipReason;
          ctx.skip(skipReason);
          return;
        }
        assertKnownAccessibilityCase(testCase);

        const processor = new MessageProcessor<SvelteCatalogComponent>([
          createDefaultAdapterCatalog(),
        ]);

        for (const step of steps) {
          await act(async () => {
            processor.processMessages(step.messages);
          });
          if (!rendered) {
            const surface = processor.model.getSurface('a11y_surface');
            expect(surface).toBeDefined();
            rendered = render(A2uiSurface, {props: {surface: surface!}});
          }
          await settleSurfaceDom(rendered.container);
          for (const [compId, expected] of Object.entries(
            step.assertions.accessibilityTree ?? {},
          )) {
            assertNodeAccessibility(rendered.container, compId, expected);
          }
          if (step.assertions.axeCore) {
            assertAxeRules(rendered.container, step.assertions.axeCore);
          }
        }
        record.status = 'passed';
      } catch (err) {
        if ((record.status as string) !== 'skipped') {
          record.status = 'failed';
          record.reason = err instanceof Error ? err.message : String(err);
        }
        throw err;
      } finally {
        rendered?.unmount();
      }
    });
  }
});

describe('@conalog/a2ui-svelte Adapter Conformance (conformance/core/adapter_conformance.yaml)', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const testCase of adapterCases) {
    const testTitle = `${testCase.name}: ${testCase.description ?? ''}`;
    it(testTitle, async ctx => {
      const record: ManifestRecord = {
        harness: 'svelte',
        suite: 'core/adapter_conformance.yaml',
        case: testCase.name,
        status: 'failed',
      };
      pendingManifestByTestName.set(testTitle, record);
      let state: ReturnType<typeof mountSurface> | undefined;
      try {
        const skipReason = findUnsupportedReason(
          testCase.name,
          testCase.steps as unknown as Array<Record<string, unknown>>,
        );
        if (skipReason) {
          record.status = 'skipped';
          record.reason = skipReason;
          ctx.skip(skipReason);
          return;
        }
        assertKnownAdapterCase(testCase);

        state = mountSurface(testCase);
        for (const step of testCase.steps) {
          await runStep(state, step);
        }
        record.status = 'passed';
      } catch (err) {
        if ((record.status as string) !== 'skipped') {
          record.status = 'failed';
          record.reason = err instanceof Error ? err.message : String(err);
        }
        throw err;
      } finally {
        if (state && !state.unmounted) {
          state.rendered?.unmount();
        }
      }
    });
  }

  describe('Framework Adapter Conformance v0.9 (adapter_conformance_v0_9.yaml)', () => {
    for (const testCase of adapterV09Cases) {
      const testTitle = `${testCase.name}: ${testCase.description ?? ''}`;
      it(testTitle, async ctx => {
        const record: ManifestRecord = {
          harness: 'svelte',
          suite: 'adapter/adapter_conformance_v0_9.yaml',
          case: testCase.name,
          status: 'failed',
        };
        pendingManifestByTestName.set(testTitle, record);
        let state: ReturnType<typeof mountSurface> | undefined;
        try {
          assertKnownAdapterCase(testCase);
          const skipReason = findUnsupportedReason(
            testCase.name,
            testCase.steps as unknown as Array<Record<string, unknown>>,
          );
          if (skipReason) {
            record.status = 'skipped';
            record.reason = skipReason;
            ctx.skip(skipReason);
            return;
          }

          state = mountSurface(testCase);
          for (const step of testCase.steps) {
            await runStep(state, step);
          }
          record.status = 'passed';
        } catch (err) {
          if ((record.status as string) !== 'skipped') {
            record.status = 'failed';
            record.reason = err instanceof Error ? err.message : String(err);
          }
          throw err;
        } finally {
          if (state && !state.unmounted) {
            state.rendered?.unmount();
          }
        }
      });
    }
  });
});
