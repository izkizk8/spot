import React from 'react';
import { render } from '@testing-library/react-native';

import { ReloadEventLog } from '@/modules/widgets-lab/components/ReloadEventLog';
import type { ReloadEvent } from '@/modules/widgets-lab/components/ReloadEventLog';

function makeEvent(i: number, status: 'success' | 'failure' = 'success'): ReloadEvent {
  return {
    id: `evt-${i}`,
    timestamp: 1000 + i,
    status,
    errorMessage: status === 'failure' ? `boom-${i}` : undefined,
  };
}

describe('ReloadEventLog', () => {
  it('renders an empty-state placeholder when log is empty', () => {
    const { getByText } = render(<ReloadEventLog events={[]} isAvailable={true} />);
    expect(getByText(/No reload/i)).toBeTruthy();
  });

  it('renders failure entries with their errorMessage', () => {
    const events: readonly ReloadEvent[] = [makeEvent(1, 'failure')];
    const { getByText } = render(<ReloadEventLog events={events} isAvailable={true} />);
    expect(getByText(/boom-1/)).toBeTruthy();
  });

  it('renders newest-first; cap at exactly 10 entries', () => {
    const events: readonly ReloadEvent[] = Array.from({ length: 10 }, (_, i) => makeEvent(i));
    const { getAllByLabelText } = render(<ReloadEventLog events={events} isAvailable={true} />);
    const items = getAllByLabelText(/^Reload event /);
    expect(items.length).toBe(10);
  });

  it('returns null when not available', () => {
    const { toJSON } = render(<ReloadEventLog events={[]} isAvailable={false} />);
    expect(toJSON()).toBeNull();
  });
});
