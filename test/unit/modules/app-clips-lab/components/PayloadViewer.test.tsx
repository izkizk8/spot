/**
 * Unit tests: PayloadViewer — App Clips Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import PayloadViewer from '@/modules/app-clips-lab/components/PayloadViewer';
import type { SimulatedInvocation } from '@/modules/app-clips-lab/simulator-store';

function makeInvocation(overrides: Partial<SimulatedInvocation> = {}): SimulatedInvocation {
  return {
    id: 1,
    receivedAt: new Date(0).toISOString(),
    url: 'https://x.example/clip',
    source: 'nfc',
    metadata: { surface: 'nfc' },
    ...overrides,
  };
}

describe('PayloadViewer', () => {
  it('renders empty-state when invocations is empty', () => {
    const { getByTestId, queryByTestId } = render(<PayloadViewer invocations={[]} />);
    expect(getByTestId('payload-empty')).toBeTruthy();
    expect(queryByTestId('payload-latest')).toBeNull();
  });

  it('renders the latest payload separately and the rest as history', () => {
    const invocations = [
      makeInvocation({ id: 3, url: 'https://x/3', source: 'qr' }),
      makeInvocation({ id: 2, url: 'https://x/2', source: 'maps' }),
      makeInvocation({ id: 1, url: 'https://x/1', source: 'nfc' }),
    ];
    const { getByTestId, getByText } = render(<PayloadViewer invocations={invocations} />);
    expect(getByTestId('payload-latest')).toBeTruthy();
    expect(getByText('https://x/3')).toBeTruthy();
    expect(getByText('https://x/2')).toBeTruthy();
    expect(getByText('https://x/1')).toBeTruthy();
    expect(getByText(/History/)).toBeTruthy();
  });

  it('shows source label resolved from catalog', () => {
    const invocations = [makeInvocation({ source: 'safari' })];
    const { getByText } = render(<PayloadViewer invocations={invocations} />);
    expect(getByText(/Safari Smart App Banner/)).toBeTruthy();
  });

  it('renders metadata key/value rows', () => {
    const invocations = [makeInvocation({ metadata: { surface: 'qr', simulated: 'true' } })];
    const { getByText } = render(<PayloadViewer invocations={invocations} />);
    expect(getByText(/surface: qr/)).toBeTruthy();
    expect(getByText(/simulated: true/)).toBeTruthy();
  });

  it('Clear button calls onClear when provided and invocations non-empty', () => {
    const onClear = jest.fn();
    const { getByTestId } = render(
      <PayloadViewer invocations={[makeInvocation()]} onClear={onClear} />,
    );
    fireEvent.press(getByTestId('clear-payloads-btn'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('Clear button is hidden when invocations is empty', () => {
    const onClear = jest.fn();
    const { queryByTestId } = render(<PayloadViewer invocations={[]} onClear={onClear} />);
    expect(queryByTestId('clear-payloads-btn')).toBeNull();
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<PayloadViewer invocations={[]} />);
    expect(toJSON()).toBeTruthy();
  });
});
