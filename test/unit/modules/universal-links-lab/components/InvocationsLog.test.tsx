/**
 * Unit tests: InvocationsLog — Universal Links Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import InvocationsLog from '@/modules/universal-links-lab/components/InvocationsLog';
import type { UniversalLinkEvent } from '@/modules/universal-links-lab/types';

function evt(overrides: Partial<UniversalLinkEvent> = {}): UniversalLinkEvent {
  return {
    url: 'https://spot.example.com/path',
    host: 'spot.example.com',
    path: '/path',
    receivedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

describe('InvocationsLog', () => {
  it('renders empty-state copy when no events', () => {
    const { getByText, queryByTestId } = render(<InvocationsLog events={[]} />);
    expect(getByText(/Waiting for incoming/)).toBeTruthy();
    expect(queryByTestId(/invocation-row-/)).toBeNull();
  });

  it('renders one row per event in order', () => {
    const events = [evt({ url: 'https://a.example/1' }), evt({ url: 'https://b.example/2' })];
    const { getAllByTestId, getByText } = render(<InvocationsLog events={events} />);
    expect(getAllByTestId(/invocation-row-/).length).toBe(2);
    expect(getByText('https://a.example/1')).toBeTruthy();
    expect(getByText('https://b.example/2')).toBeTruthy();
  });

  it('shows host line when host is non-empty', () => {
    const { getAllByText } = render(<InvocationsLog events={[evt()]} />);
    expect(getAllByText(/host: spot\.example\.com/).length).toBe(1);
  });

  it('omits host line when host is empty', () => {
    const { queryByText } = render(<InvocationsLog events={[evt({ host: '' })]} />);
    expect(queryByText(/host: /)).toBeNull();
  });

  it('renders a Clear button when onClear is provided and events are present', () => {
    const onClear = jest.fn();
    const { getByTestId } = render(<InvocationsLog events={[evt()]} onClear={onClear} />);
    fireEvent.press(getByTestId('clear-invocations-btn'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not render a Clear button when there are no events', () => {
    const { queryByTestId } = render(<InvocationsLog events={[]} onClear={jest.fn()} />);
    expect(queryByTestId('clear-invocations-btn')).toBeNull();
  });
});
