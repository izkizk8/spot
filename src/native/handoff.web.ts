/**
 * JS bridge — non-iOS path (Web / Android stub).
 *
 * Every method rejects or throws `HandoffNotSupported`.
 * This is the source of truth for non-iOS platforms.
 */

import type { ActivityDefinition } from '@/modules/handoff-lab/types';

export class HandoffNotSupported extends Error {
  constructor(method: string) {
    super(`Handoff is not supported on this platform (called: ${method}).`);
    this.name = 'HandoffNotSupported';
  }
}

export const isAvailable = false;

export function setCurrent(_definition: ActivityDefinition): Promise<void> {
  return Promise.reject(new HandoffNotSupported('setCurrent'));
}

export function resignCurrent(): Promise<void> {
  return Promise.reject(new HandoffNotSupported('resignCurrent'));
}

export function getCurrent(): Promise<null> {
  return Promise.reject(new HandoffNotSupported('getCurrent'));
}

export function addContinuationListener(_cb: (event: any) => void): () => void {
  throw new HandoffNotSupported('addContinuationListener');
}
