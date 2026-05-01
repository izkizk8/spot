/**
 * Unit tests: IncomingLog (T032 / US4).
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IncomingLog from '@/modules/handoff-lab/components/IncomingLog';
import type { ContinuationEvent } from '@/modules/handoff-lab/types';

function makeEvent(i: number, overrides: Partial<ContinuationEvent> = {}): ContinuationEvent {
  return {
    activityType: `com.example.t${i}`,
    title: `Title ${i}`,
    userInfo: { idx: i },
    requiredUserInfoKeys: [],
    receivedAt: new Date(2026, 0, i + 1).toISOString(),
    ...overrides,
  };
}

describe('IncomingLog', () => {
  it('shows empty-state copy when events is empty', () => {
    const { getByText } = render(<IncomingLog events={[]} />);
    expect(getByText(/Waiting for incoming activities/i)).toBeTruthy();
  });

  it('renders activityType, title, userInfo, requiredUserInfoKeys, receivedAt', () => {
    const evt = makeEvent(0, {
      webpageURL: 'https://example.com',
      userInfo: { hello: 'world' },
      requiredUserInfoKeys: ['hello'],
    });
    const { getByText } = render(<IncomingLog events={[evt]} />);
    expect(getByText(/com\.example\.t0/)).toBeTruthy();
    expect(getByText(/Title 0/)).toBeTruthy();
    expect(getByText(/https:\/\/example\.com/)).toBeTruthy();
    expect(getByText(/"hello"/)).toBeTruthy();
    expect(getByText(new RegExp(evt.receivedAt))).toBeTruthy();
  });

  it('renders one row per event in input order (caller enforces 10-cap)', () => {
    const events = Array.from({ length: 11 }, (_, i) => makeEvent(i));
    const { getAllByTestId } = render(<IncomingLog events={events} />);
    const rows = getAllByTestId(/incoming-row-/);
    expect(rows.length).toBe(11);
  });

  it('renders rows in input order (most-recent first when caller prepends)', () => {
    const events = [makeEvent(2), makeEvent(1), makeEvent(0)];
    const { getAllByTestId } = render(<IncomingLog events={events} />);
    const rows = getAllByTestId(/incoming-row-/);
    expect(rows[0].props.testID).toBe('incoming-row-0');
    expect(rows[1].props.testID).toBe('incoming-row-1');
    expect(rows[2].props.testID).toBe('incoming-row-2');
  });
});
