/**
 * Tests for the in-memory event log reducer.
 *
 * @see specs/013-app-intents/data-model.md
 */

import {
  EMPTY_LOG,
  EVENT_LOG_CAPACITY,
  eventLogReducer,
  type IntentInvocation,
  type EventLogAction,
} from '@/modules/app-intents-lab/event-log';

function makeInvocation(id: string): IntentInvocation {
  return {
    id,
    timestamp: Number(id),
    intentName: 'LogMoodIntent',
    parameters: { mood: 'happy' },
    result: `result-${id}`,
    status: 'success',
  };
}

describe('event-log reducer', () => {
  it('EVENT_LOG_CAPACITY === 10', () => {
    expect(EVENT_LOG_CAPACITY).toBe(10);
  });

  it('append on empty returns [invocation]', () => {
    const inv = makeInvocation('1');
    const next = eventLogReducer(EMPTY_LOG, { type: 'append', invocation: inv });
    expect(next).toEqual([inv]);
  });

  it('N appends (N <= 10) → length N newest-first', () => {
    let state = EMPTY_LOG;
    for (let i = 1; i <= 10; i++) {
      state = eventLogReducer(state, { type: 'append', invocation: makeInvocation(String(i)) });
    }
    expect(state).toHaveLength(10);
    expect(state[0].id).toBe('10');
    expect(state[9].id).toBe('1');
  });

  it('N appends (N > 10) → length 10, newest at index 0, oldest evicted', () => {
    let state = EMPTY_LOG;
    for (let i = 1; i <= 15; i++) {
      state = eventLogReducer(state, { type: 'append', invocation: makeInvocation(String(i)) });
    }
    expect(state).toHaveLength(EVENT_LOG_CAPACITY);
    expect(state[0].id).toBe('15');
    expect(state[9].id).toBe('6');
    expect(state.find((r) => r.id === '1')).toBeUndefined();
    expect(state.find((r) => r.id === '5')).toBeUndefined();
  });

  it('clear returns EMPTY_LOG', () => {
    const state = eventLogReducer(EMPTY_LOG, {
      type: 'append',
      invocation: makeInvocation('1'),
    });
    const cleared = eventLogReducer(state, { type: 'clear' });
    expect(cleared).toBe(EMPTY_LOG);
    expect(cleared).toHaveLength(0);
  });

  it('unrecognised action returns the same state reference (identity-stable)', () => {
    const state = eventLogReducer(EMPTY_LOG, {
      type: 'append',
      invocation: makeInvocation('1'),
    });
    const unknown = { type: 'wat' } as unknown as EventLogAction;
    const next = eventLogReducer(state, unknown);
    expect(next).toBe(state);
  });
});
