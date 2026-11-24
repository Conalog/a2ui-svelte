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
 * A scripted stand-in for an agent. A POST without a message opens a table
 * booking form; a POST carrying the form's `book_table` action answers with a
 * confirmation. Responses are JSON Lines, one A2UI message per line, streamed
 * with short pauses so the client renders them progressively.
 */

import {error} from '@sveltejs/kit';

import type {RequestHandler} from './$types';

const SURFACE_ID = 'booking';
const CATALOG_ID = 'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json';

const OPEN_FORM = [
  {version: '1.0', createSurface: {surfaceId: SURFACE_ID, catalogId: CATALOG_ID}},
  {
    version: '1.0',
    updateDataModel: {surfaceId: SURFACE_ID, path: '/booking', value: {name: '', guests: 2}},
  },
  {
    version: '1.0',
    updateComponents: {
      surfaceId: SURFACE_ID,
      components: [
        {id: 'root', component: 'Card', child: 'form'},
        {id: 'form', component: 'Column', children: ['title', 'name', 'guests', 'book']},
        {id: 'title', component: 'Text', text: '## Book a table'},
        {
          id: 'name',
          component: 'TextField',
          label: 'Name',
          value: {'@path': '/booking/name'},
          checks: [
            {
              condition: {'@call': 'required', args: {value: {'@path': '/booking/name'}}},
              message: 'Enter the name for the booking.',
            },
          ],
        },
        {
          id: 'guests',
          component: 'Slider',
          label: 'Guests',
          min: 1,
          max: 8,
          value: {'@path': '/booking/guests'},
        },
        {
          id: 'book',
          component: 'Button',
          child: 'book_text',
          action: {
            event: {
              name: 'book_table',
              context: {name: {'@path': '/booking/name'}, guests: {'@path': '/booking/guests'}},
            },
          },
        },
        {id: 'book_text', component: 'Text', text: 'Book'},
      ],
    },
  },
];

function confirmation(name: string, guests: number) {
  return [
    {
      version: '1.0',
      updateDataModel: {surfaceId: SURFACE_ID, path: '/confirmation', value: {name, guests}},
    },
    {
      version: '1.0',
      updateComponents: {
        surfaceId: SURFACE_ID,
        components: [
          {id: 'root', component: 'Card', child: 'done'},
          {id: 'done', component: 'Column', children: ['done_title', 'done_text']},
          {id: 'done_title', component: 'Text', text: '## Table booked'},
          {
            id: 'done_text',
            component: 'Text',
            text: {
              '@call': 'formatString',
              args: {value: 'A table for ${/confirmation/guests} under ${/confirmation/name}.'},
            },
          },
        ],
      },
    },
  ];
}

/** The `book_table` action in a renderer-to-agent message, if that is what it is. */
function readBooking(body: unknown): {name: string; guests: number} | undefined {
  const action = (body as {message?: {action?: {name?: unknown; context?: unknown}}})?.message
    ?.action;
  if (action?.name !== 'book_table') return undefined;
  const context = (action.context ?? {}) as {name?: unknown; guests?: unknown};
  const name = typeof context.name === 'string' ? context.name.trim().slice(0, 80) : '';
  const guests = typeof context.guests === 'number' ? Math.round(context.guests) : NaN;
  if (!name || !(guests >= 1 && guests <= 8)) return undefined;
  return {name, guests};
}

function streamJsonLines(messages: readonly unknown[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const message of messages) {
        controller.enqueue(encoder.encode(`${JSON.stringify(message)}\n`));
        await new Promise(resolve => setTimeout(resolve, 120));
      }
      controller.close();
    },
  });
  return new Response(body, {
    headers: {'content-type': 'application/jsonl; charset=utf-8', 'cache-control': 'no-store'},
  });
}

export const POST: RequestHandler = async ({request}) => {
  const body: unknown = await request.json().catch(() => ({}));
  if (!(body as {message?: unknown})?.message) {
    return streamJsonLines(OPEN_FORM);
  }
  const booking = readBooking(body);
  if (!booking) {
    error(400, 'Expected a book_table action with a name and 1 to 8 guests.');
  }
  return streamJsonLines(confirmation(booking.name, booking.guests));
};
