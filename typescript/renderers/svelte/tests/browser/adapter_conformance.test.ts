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
 * The official adapter and accessibility conformance suites in Chromium. The
 * same harness runs in jsdom (`tests/adapter_conformance.test.ts`); here the
 * page has a layout engine, so the `axeCore` rules of `accessibility.yaml`
 * run through axe-core itself instead of the attribute checks jsdom allows.
 */

import {act, render} from '@testing-library/svelte';
import axe from 'axe-core';
import {afterAll, afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {MessageProcessor} from '@a2ui/web_core';

import {A2uiSurface, type SvelteCatalogComponent} from '../../src/index.js';
import {
  type AccessibilityStep,
  assertAllUnsupportedMatched,
  assertKnownAccessibilityCase,
  assertKnownAdapterCase,
  assertNodeAccessibility,
  createDefaultAdapterCatalog,
  findUnsupportedReason,
  mountSurface,
  type RenderedSurface,
  runStep,
  settleSurfaceDom,
} from '../adapter_harness.js';
import {accessibilityCases, adapterCases, adapterV09Cases} from './conformance_suites.js';

async function assertAxeRulesPass(container: HTMLElement, rules: string[]): Promise<void> {
  const results = await axe.run(container, {runOnly: {type: 'rule', values: rules}});
  const violations = results.violations.map(
    violation =>
      `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`,
  );
  expect(violations, 'axe-core violations').toEqual([]);
}

afterAll(() => {
  assertAllUnsupportedMatched(accessibilityCases, adapterCases, adapterV09Cases);
});

describe('Accessibility conformance in a browser (conformance/core/accessibility.yaml)', () => {
  for (const testCase of accessibilityCases) {
    it(`${testCase.name}: ${testCase.description ?? ''}`, async ctx => {
      const steps: AccessibilityStep[] = testCase.steps ?? [
        {messages: testCase.messages ?? [], assertions: testCase.assertions ?? {}},
      ];
      const skipReason = findUnsupportedReason(
        testCase.name,
        steps as unknown as Array<Record<string, unknown>>,
      );
      if (skipReason) {
        ctx.skip(skipReason);
        return;
      }
      assertKnownAccessibilityCase(testCase);

      const processor = new MessageProcessor<SvelteCatalogComponent>([
        createDefaultAdapterCatalog(),
      ]);
      let rendered: RenderedSurface | undefined;
      try {
        for (const step of steps) {
          await act(() => {
            processor.processMessages(step.messages);
          });
          if (!rendered) {
            const surface = processor.model.getSurface('a11y_surface');
            expect(surface).toBeDefined();
            rendered = render(A2uiSurface, {props: {surface: surface!}});
          }
          await settleSurfaceDom(rendered.container);
          for (const [componentId, expected] of Object.entries(
            step.assertions.accessibilityTree ?? {},
          )) {
            assertNodeAccessibility(rendered.container, componentId, expected);
          }
          if (step.assertions.axeCore) {
            await assertAxeRulesPass(rendered.container, step.assertions.axeCore);
          }
        }
      } finally {
        rendered?.unmount();
      }
    });
  }
});

describe('Adapter conformance in a browser (conformance/core/adapter_conformance.yaml)', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const [suite, cases] of [
    ['core/adapter_conformance.yaml', adapterCases],
    ['adapter/adapter_conformance_v0_9.yaml', adapterV09Cases],
  ] as const) {
    describe(suite, () => {
      for (const testCase of cases) {
        it(`${testCase.name}: ${testCase.description ?? ''}`, async ctx => {
          const skipReason = findUnsupportedReason(
            testCase.name,
            testCase.steps as unknown as Array<Record<string, unknown>>,
          );
          if (skipReason) {
            ctx.skip(skipReason);
            return;
          }
          assertKnownAdapterCase(testCase);

          const state = mountSurface(testCase);
          try {
            for (const step of testCase.steps) {
              await runStep(state, step);
            }
          } finally {
            if (!state.unmounted) {
              state.rendered?.unmount();
            }
          }
        });
      }
    });
  }
});
