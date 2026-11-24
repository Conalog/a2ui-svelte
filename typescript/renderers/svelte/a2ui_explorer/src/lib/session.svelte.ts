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

/** One example loaded into its own message processor, stepped through message by message. */

import {MessageProcessor, type SurfaceModel} from '@a2ui/web_core';
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
import type {SvelteCatalogComponent} from '@conalog/a2ui-svelte';

import {demoCatalog, v09DemoCatalog} from './demo-catalog.js';
import type {Example} from './examples.js';

export interface EventEntry {
  readonly id: number;
  readonly time: string;
  readonly kind: 'action' | 'error';
  readonly surfaceId: string;
  readonly payload: unknown;
}

let nextEventId = 0;

export class GallerySession {
  /** How many of the example's messages have been processed. */
  processed = $state(0);
  surfaces = $state.raw<ReadonlyArray<SurfaceModel<SvelteCatalogComponent>>>([]);
  events = $state.raw<readonly EventEntry[]>([]);
  /** Each surface's data model, as formatted JSON. */
  dataModels = $state.raw<Readonly<Record<string, string>>>({});

  private readonly processor: MessageProcessor<SvelteCatalogComponent>;
  private readonly cleanups: Array<() => void> = [];

  constructor(readonly example: Example) {
    const catalogs = example.version === 'v0.9' ? [v09DemoCatalog] : [basicCatalog, demoCatalog];
    this.processor = new MessageProcessor<SvelteCatalogComponent>(catalogs, action => {
      this.record('action', action.surfaceId, action);
    });

    const created = this.processor.model.onSurfaceCreated.subscribe(surface => {
      this.surfaces = [...this.surfaces, surface];
      const errors = surface.onError.subscribe(error => {
        this.record('error', surface.id, error);
      });
      const data = surface.dataModel.subscribe('/', () => this.showDataModel(surface));
      this.showDataModel(surface);
      this.cleanups.push(
        () => errors.unsubscribe(),
        () => data.unsubscribe(),
      );
    });
    const deleted = this.processor.model.onSurfaceDeleted.subscribe(id => {
      this.surfaces = this.surfaces.filter(surface => surface.id !== id);
      const {[id]: _removed, ...rest} = this.dataModels;
      this.dataModels = rest;
    });
    this.cleanups.push(
      () => created.unsubscribe(),
      () => deleted.unsubscribe(),
    );
  }

  get done(): boolean {
    return this.processed >= this.example.messages.length;
  }

  /** Processes the next message. */
  step(): void {
    const message = this.example.messages[this.processed];
    if (!message) return;
    this.processed += 1;
    try {
      this.processor.processMessages([message]);
    } catch (error) {
      this.record('error', '', error instanceof Error ? error.message : String(error));
    }
  }

  /** Processes every remaining message. */
  runAll(): void {
    while (!this.done) this.step();
  }

  dispose(): void {
    for (const cleanup of this.cleanups.splice(0)) cleanup();
  }

  private showDataModel(surface: SurfaceModel<SvelteCatalogComponent>): void {
    this.dataModels = {
      ...this.dataModels,
      [surface.id]: JSON.stringify(surface.dataModel.get('/') ?? {}, null, 2),
    };
  }

  private record(kind: EventEntry['kind'], surfaceId: string, payload: unknown): void {
    const entry = {
      id: nextEventId++,
      // A timestamp for display, never mutated.
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      time: new Date().toLocaleTimeString(),
      kind,
      surfaceId,
      payload,
    };
    this.events = [entry, ...this.events];
  }
}
