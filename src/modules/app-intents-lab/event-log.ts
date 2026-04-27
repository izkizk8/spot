/**
 * In-memory ring-buffer reducer for the iOS-only intent event log.
 *
 * Newest-first ordering (most recently appended at index 0).
 * Capped at EVENT_LOG_CAPACITY entries.
 *
 * @see specs/013-app-intents/data-model.md
 */

/** Capacity of the in-memory event log ring buffer (FR-022). */
export const EVENT_LOG_CAPACITY = 10;

export type IntentName = 'LogMoodIntent' | 'GetLastMoodIntent' | 'GreetUserIntent';

export type IntentStatus = 'success' | 'failure';

export interface IntentInvocation {
  readonly id: string;
  readonly timestamp: number;
  readonly intentName: IntentName;
  readonly parameters: Readonly<Record<string, unknown>> | undefined;
  readonly result: string;
  readonly status: IntentStatus;
}

export type EventLogState = readonly IntentInvocation[];

export const EMPTY_LOG: EventLogState = [] as const;

export type EventLogAction =
  | { type: 'append'; invocation: IntentInvocation }
  | { type: 'clear' };

export function eventLogReducer(state: EventLogState, action: EventLogAction): EventLogState {
  switch (action.type) {
    case 'append': {
      const next = [action.invocation, ...state];
      if (next.length > EVENT_LOG_CAPACITY) {
        return next.slice(0, EVENT_LOG_CAPACITY);
      }
      return next;
    }
    case 'clear':
      return EMPTY_LOG;
    default:
      return state;
  }
}
