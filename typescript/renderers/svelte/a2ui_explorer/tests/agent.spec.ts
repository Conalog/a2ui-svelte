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

import {expect, test} from '@playwright/test';

test('reads the agent over JSON Lines and posts actions back', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/agent');
  await expect(page.getByRole('heading', {name: 'Book a table'})).toBeVisible();
  await expect(page.getByTestId('agent-status')).toHaveText('3 messages received');

  await page.locator('a2ui-basic-textfield input').fill('Ada');
  await page.getByRole('button', {name: 'Book'}).click();

  await expect(page.getByRole('heading', {name: 'Table booked'})).toBeVisible();
  await expect(page.getByText('A table for 2 under Ada.')).toBeVisible();
  await expect(page.getByTestId('agent-status')).toHaveText(
    '5 messages received, sent: book_table',
  );
  expect(errors).toEqual([]);
});

test('the agent endpoint rejects an action it does not expect', async ({request}) => {
  const response = await request.post('/api/agent', {
    data: {message: {version: '1.0', action: {name: 'drop_tables', context: {}}}},
  });
  expect(response.status()).toBe(400);
});
