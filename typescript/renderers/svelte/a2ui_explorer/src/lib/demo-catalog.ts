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

/** Catalogs that mix the basic catalog with components written in Svelte. */

import {z} from 'zod';

import {Catalog} from '@a2ui/web_core';
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';
import {
  BASIC_FUNCTIONS as V09_BASIC_FUNCTIONS,
  basicCatalog as v09BasicCatalog,
} from '@a2ui/web_core/v0_9/basic_catalog';
import {ChildListSchema, DynamicNumberSchema, DynamicStringSchema} from '@a2ui/web_core/v0_9';
import {CommonSchemas} from '@a2ui/web_core/v1_0';
import {createComponentImplementation, type SvelteCatalogComponent} from '@conalog/a2ui-svelte';

import CustomGrid from './components/CustomGrid.svelte';
import CustomSlider from './components/CustomSlider.svelte';
import StatusBadge from './components/StatusBadge.svelte';

export const DEMO_CATALOG_ID = 'https://example.com/a2ui-svelte/demo_catalog.json';

export const StatusBadgeApi = {
  name: 'StatusBadge',
  schema: z.object({
    label: CommonSchemas.DynamicString,
    tone: z.enum(['neutral', 'positive', 'warning']).optional(),
  }),
};

export const demoCatalog = new Catalog<SvelteCatalogComponent>(
  DEMO_CATALOG_ID,
  '1.0',
  [...basicCatalog.components.values(), createComponentImplementation(StatusBadgeApi, StatusBadge)],
  [...basicCatalog.functions.values()],
);

/**
 * The v0.9 basic catalog under its own id, extended with the CustomGrid and
 * CustomSlider components that the official native-grid example asks for.
 */
export const v09DemoCatalog = new Catalog<SvelteCatalogComponent>(
  v09BasicCatalog.id,
  '0.9',
  [
    ...v09BasicCatalog.components.values(),
    createComponentImplementation(
      {
        name: 'CustomGrid',
        schema: z.object({
          title: DynamicStringSchema.optional(),
          description: DynamicStringSchema.optional(),
          children: ChildListSchema.optional(),
        }),
      },
      CustomGrid,
    ),
    createComponentImplementation(
      {
        name: 'CustomSlider',
        schema: z.object({
          label: DynamicStringSchema.optional(),
          value: DynamicNumberSchema.optional(),
          min: DynamicNumberSchema.optional(),
          max: DynamicNumberSchema.optional(),
        }),
      },
      CustomSlider,
    ),
  ],
  V09_BASIC_FUNCTIONS,
  {themeSchema: v09BasicCatalog.themeSchema},
);
