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

import {afterEach, describe, expect, it} from 'vitest';

import {type ComponentNode, MessageProcessor, NodeResolver, peekValue} from '@a2ui/web_core';
import {basicCatalog} from '@a2ui/web_core/catalogs/basic/v1';

import {resolveChild, toViewProps} from '../src/node-view.svelte.js';
import type {SvelteCatalogComponent} from '../src/svelte_component_implementation.js';

let resolver: NodeResolver<SvelteCatalogComponent> | undefined;

afterEach(() => {
  resolver?.dispose();
  resolver = undefined;
});

function resolveRoot(components: Array<Record<string, unknown>>, dataModel = {}) {
  const processor = new MessageProcessor<SvelteCatalogComponent>([basicCatalog]);
  processor.processMessages([
    {
      version: '1.0',
      createSurface: {surfaceId: 's', catalogId: basicCatalog.id, dataModel, components},
    },
  ]);
  resolver = new NodeResolver(processor.model.getSurface('s')!);
  const root = peekValue(resolver.rootNode) as ComponentNode<SvelteCatalogComponent>;
  return {root, view: toViewProps(peekValue(root.props))};
}

describe('child references in view props', () => {
  it('turn template items into tokens that resolve to their instances', () => {
    const {root, view} = resolveRoot(
      [
        {id: 'root', component: 'List', children: {componentId: 'row', path: '/items'}},
        {id: 'row', component: 'Text', text: {'@path': 'name'}},
      ],
      {items: [{name: 'Ada'}, {name: 'Lin'}]},
    );

    const tokens = view.props['children'] as string[];
    expect(tokens).toHaveLength(2);
    expect(new Set(tokens).size).toBe(2);
    expect(
      tokens.map(token => resolveChild(token, view.children, root.dataPath)?.dataPath),
    ).toEqual(['/items/0', '/items/1']);
  });

  it('resolve an {id, basePath} reference to the instance at that scope', () => {
    const {root, view} = resolveRoot(
      [
        {id: 'root', component: 'List', children: {componentId: 'row', path: '/items'}},
        {id: 'row', component: 'Text', text: {'@path': 'name'}},
      ],
      {items: [{name: 'Ada'}, {name: 'Lin'}]},
    );

    const second = resolveChild({id: 'row', basePath: '/items/1'}, view.children, root.dataPath);
    expect(second?.componentId).toBe('row');
    expect(second?.dataPath).toBe('/items/1');
    // No instance exists at a scope the payload does not imply.
    expect(resolveChild({id: 'row', basePath: '/other'}, view.children, root.dataPath)).toBe(
      undefined,
    );
    // A raw id names the instance at the parent's own scope, and template items are not there.
    expect(resolveChild('row', view.children, root.dataPath)).toBe(undefined);
  });

  it('accept a raw component id for an explicit child list', () => {
    const {root, view} = resolveRoot([
      {id: 'root', component: 'Column', children: ['first', 'second']},
      {id: 'first', component: 'Text', text: 'One'},
      {id: 'second', component: 'Text', text: 'Two'},
    ]);

    expect(resolveChild('second', view.children, root.dataPath)?.componentId).toBe('second');
    expect(
      resolveChild({id: 'first', basePath: root.dataPath}, view.children, root.dataPath)
        ?.componentId,
    ).toBe('first');
    expect(resolveChild('missing', view.children, root.dataPath)).toBe(undefined);
  });
});
