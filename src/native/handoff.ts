/**
 * JS bridge — iOS path.
 *
 * Re-exports the native `Handoff` module via expo-modules-core.
 * Consumers mock this module at the import boundary (jest.mock('@/native/handoff')).
 */

import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import type { ActivityDefinition, ContinuationEvent } from '@/modules/handoff-lab/types';

interface NativeHandoff {
  setCurrent: (definition: ActivityDefinition) => Promise<void>;
  resignCurrent: () => Promise<void>;
  getCurrent: () => Promise<ActivityDefinition | null>;
}

const native = requireNativeModule('Handoff') as unknown as NativeHandoff;
const emitter = new EventEmitter(
  native as unknown as ConstructorParameters<typeof EventEmitter>[0],
);

export const isAvailable = true;

export function setCurrent(definition: ActivityDefinition): Promise<void> {
  return native.setCurrent(definition);
}

export function resignCurrent(): Promise<void> {
  return native.resignCurrent();
}

export function getCurrent(): Promise<ActivityDefinition | null> {
  return native.getCurrent();
}

export function addContinuationListener(
  cb: (event: Omit<ContinuationEvent, 'receivedAt'>) => void,
): () => void {
  const sub = (
    emitter as unknown as {
      addListener: (
        name: string,
        cb: (event: Omit<ContinuationEvent, 'receivedAt'>) => void,
      ) => { remove: () => void };
    }
  ).addListener('onContinue', cb);
  return () => sub.remove();
}
