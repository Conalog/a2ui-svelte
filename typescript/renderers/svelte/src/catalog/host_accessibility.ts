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
 * The attachments a Svelte implementation uses to mark elements for its
 * host's accessibility attributes (see `bindHostAccessibility` in
 * `@a2ui/web_core/universal`): `accessibilityRef` for the element that
 * carries the label, description and validation state, and
 * `validationErrorsRef` for the element that shows the validation errors.
 */

import type {Attachment} from 'svelte/attachments';
import {type ComponentNode, peekValue, type Signal, setValue} from '@a2ui/web_core';
import {type AccessibilityTargets, createAccessibilityTargets} from '@a2ui/web_core/universal';

/** A node's accessibility targets and the attachments that set them. */
export interface HostRefs extends AccessibilityTargets {
  readonly accessibilityRef: Attachment<Element>;
  readonly validationErrorsRef: Attachment<Element>;
}

const hostRefs = new WeakMap<ComponentNode, HostRefs>();

/** One set per node, shared by the host element and the implementation. */
export function hostRefsOf(node: ComponentNode): HostRefs {
  let refs = hostRefs.get(node);
  if (!refs) {
    const targets = createAccessibilityTargets();
    refs = {
      ...targets,
      accessibilityRef: attachTo(targets.target),
      validationErrorsRef: attachTo(targets.errors),
    };
    hostRefs.set(node, refs);
  }
  return refs;
}

function attachTo(target: Signal<Element | null>): Attachment<Element> {
  return element => {
    setValue(target, element);
    return () => {
      // Another element may have taken the slot since; leave it alone.
      if (peekValue(target) === element) {
        setValue(target, null);
      }
    };
  };
}
