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
 * The official conformance suites, bundled into the browser test build. The
 * paths are the same here and in the official repository, where this package
 * sits at `typescript/renderers/svelte`.
 */

import * as yaml from 'js-yaml';

import accessibilityYaml from '../../../../../conformance/core/accessibility.yaml?raw';
import adapterYaml from '../../../../../conformance/core/adapter_conformance.yaml?raw';
import adapterV09Yaml from '../../../../../conformance/adapter/adapter_conformance_v0_9.yaml?raw';
import type {AccessibilityTestCase, AdapterTestCase} from '../adapter_harness.js';

export const accessibilityCases = yaml.load(accessibilityYaml) as AccessibilityTestCase[];
export const adapterCases = yaml.load(adapterYaml) as AdapterTestCase[];
export const adapterV09Cases = yaml.load(adapterV09Yaml) as AdapterTestCase[];
