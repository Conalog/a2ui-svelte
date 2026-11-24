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

import {expect, type Page, test} from '@playwright/test';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../..');

interface ExampleFile {
  messages: Array<Record<string, unknown>>;
}

function listExamples(dir: string, version: string) {
  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as ExampleFile;
      return {id: file.replace(/\.json$/, ''), version, messageCount: content.messages.length};
    });
}

const EXAMPLES = [
  ...listExamples(path.join(import.meta.dirname, '../src/lib/examples'), 'v1.0'),
  ...listExamples(path.join(REPO_ROOT, 'catalogs/basic/v1/examples'), 'v1.0'),
  ...listExamples(path.join(REPO_ROOT, 'catalogs/basic/v0_9/examples'), 'v0.9'),
];

/** Collects uncaught page errors and console errors for the rest of the test. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function openExample(page: Page, version: string, id: string) {
  await page.goto(`/?version=${version}&example=${id}`);
  // The server renders an empty preview; the client runs the example once it hydrates.
  await expect(page.locator('[data-surface-id]').first()).toBeAttached();
}

test.describe('every example renders without errors', () => {
  for (const example of EXAMPLES) {
    test(`${example.version} ${example.id}`, async ({page}) => {
      const errors = collectErrors(page);
      await openExample(page, example.version, example.id);

      await expect(
        page.getByRole('heading', {
          name: `Messages (${example.messageCount} / ${example.messageCount})`,
        }),
      ).toBeVisible();
      // Each surface renders its root component's element.
      const surfaces = page.getByTestId('surfaces').locator('[data-surface-id]');
      await expect(surfaces.first()).toBeVisible();
      for (const surface of await surfaces.all()) {
        await expect(surface.locator(':scope > *').first()).toBeAttached();
      }
      expect(errors).toEqual([]);
    });
  }
});

test('a Svelte component renders inside basic catalog containers and dispatches actions', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openExample(page, 'v1.0', 'svelte-status-badge');

  const badge = page.getByTestId('status-badge');
  await expect(badge).toHaveText('Shipped');
  await expect(page.locator('a2ui-basic-row a2ui-svelte-statusbadge')).toHaveCount(1);

  await page.getByRole('button', {name: 'Mark as shipped'}).click();
  const events = page.getByTestId('events');
  await expect(events).toContainText('"name": "ship_order"');
  await expect(events).toContainText('"orderId": "A-1042"');
  expect(errors).toEqual([]);
});

test('typing into a form updates the data model', async ({page}) => {
  await openExample(page, 'v1.0', 'login-form');

  const email = page.locator('a2ui-basic-textfield input').first();
  await email.fill('ada@example.com');
  await expect(page.getByTestId('data-model').first()).toContainText('ada@example.com');
  await expect(email).toBeFocused();
});

test('the stepper processes one message at a time', async ({page}) => {
  await openExample(page, 'v1.0', 'svelte-status-badge');

  await page.getByRole('button', {name: 'Reset'}).click();
  await expect(page.getByRole('heading', {name: 'Messages (0 / 3)'})).toBeVisible();
  await expect(page.locator('[data-surface-id]')).toHaveCount(0);

  await page.getByRole('button', {name: 'Step', exact: true}).click();
  await expect(page.locator('[data-surface-id]')).toHaveCount(1);
  await page.getByRole('button', {name: 'Step', exact: true}).click();
  await expect(page.getByTestId('status-badge')).toHaveText('Packed');
  await page.getByRole('button', {name: 'Step', exact: true}).click();
  await expect(page.getByTestId('status-badge')).toHaveText('Shipped');
  await expect(page.getByRole('button', {name: 'Step', exact: true})).toBeDisabled();
});

test('the host page themes the surface with CSS custom properties', async ({page}) => {
  await openExample(page, 'v1.0', 'scaffold-interactive-button');

  await page.getByLabel('Primary color').fill('#ff5500');
  const button = page.locator('a2ui-basic-button').first();
  await expect
    .poll(() =>
      button.evaluate(el => getComputedStyle(el).getPropertyValue('--a2ui-color-primary')),
    )
    .toBe('#ff5500');
});
