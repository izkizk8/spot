/**
 * SharePlay Lab — frozen activity-type catalog (feature 047).
 *
 * Three demo `GroupActivity` types vended by the showcase module.
 * The bridge accepts the `id` verbatim; the iOS side keys the
 * activity payload off it.
 */

import type { ActivityType } from '@/native/shareplay.types';

export interface ActivityTypeDescriptor {
  readonly id: ActivityType;
  readonly label: string;
  readonly description: string;
  readonly defaultTitle: string;
}

export const ACTIVITY_TYPES: readonly ActivityTypeDescriptor[] = Object.freeze([
  Object.freeze({
    id: 'counter',
    label: 'Counter',
    description: 'A shared integer counter — every participant sees +/- updates live.',
    defaultTitle: 'Showcase Counter',
  }),
  Object.freeze({
    id: 'drawing',
    label: 'Drawing',
    description: 'A scaffold for a future shared canvas demo. Status reporting only.',
    defaultTitle: 'Showcase Drawing',
  }),
  Object.freeze({
    id: 'quiz',
    label: 'Quiz',
    description: 'A scaffold for a future synchronised quiz demo. Status reporting only.',
    defaultTitle: 'Showcase Quiz',
  }),
]);

export const DEFAULT_ACTIVITY_TYPE: ActivityType = 'counter';

export function findActivityType(id: string): ActivityTypeDescriptor | undefined {
  return ACTIVITY_TYPES.find((t) => t.id === id);
}

/**
 * Returns true when the activity has a live shared-state surface
 * worth rendering (the `CounterActivity` component). Today only
 * Counter qualifies; the other two are status-only scaffolds.
 */
export function hasLivePayload(id: ActivityType): boolean {
  return id === 'counter';
}
