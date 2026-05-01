import React from 'react';
import { render } from '@testing-library/react-native';

import {
  ReloadEventLog,
  type ReloadEvent,
} from '@/modules/lock-widgets-lab/components/ReloadEventLog';

describe('ReloadEventLog (lock-widgets-lab)', () => {
  it('renders empty-state when given entries: []', () => {
    const { getByText } = render(<ReloadEventLog entries={[]} />);

    expect(getByText(/no.*push/i)).toBeTruthy();
  });

  it('renders one row per entry with timestamp, kind, outcome', () => {
    const entries: ReloadEvent[] = [
      {
        timestamp: Date.now(),
        kind: 'SpotLockScreenWidget',
        success: true,
      },
      {
        timestamp: Date.now() - 1000,
        kind: 'SpotLockScreenWidget',
        success: false,
        error: 'Test error',
      },
    ];

    const { getAllByText } = render(<ReloadEventLog entries={entries} />);

    expect(getAllByText(/SpotLockScreenWidget/i).length).toBe(2);
    expect(getAllByText(/✓/i).length).toBeGreaterThanOrEqual(1);
    expect(getAllByText(/✗/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 10 entries when given entries.length === 10', () => {
    const entries: ReloadEvent[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - i * 1000,
      kind: 'SpotLockScreenWidget',
      success: i % 2 === 0,
    }));

    const { getAllByText } = render(<ReloadEventLog entries={entries} />);

    // Should render all 10 entries
    const rows = getAllByText(/SpotLockScreenWidget/i);
    expect(rows.length).toBe(10);
  });

  it('success vs failure entries are visually distinguished', () => {
    const entries: ReloadEvent[] = [
      {
        timestamp: Date.now(),
        kind: 'SpotLockScreenWidget',
        success: true,
      },
      {
        timestamp: Date.now() - 1000,
        kind: 'SpotLockScreenWidget',
        success: false,
        error: 'Failed',
      },
    ];

    const { getAllByLabelText } = render(<ReloadEventLog entries={entries} />);

    const successEntry = getAllByLabelText(/success/i);
    const failureEntry = getAllByLabelText(/fail|error/i);

    expect(successEntry.length).toBeGreaterThanOrEqual(1);
    expect(failureEntry.length).toBeGreaterThanOrEqual(1);
  });

  it('most recent entry appears first', () => {
    const now = Date.now();
    const entries: ReloadEvent[] = [
      {
        timestamp: now,
        kind: 'SpotLockScreenWidget',
        success: true,
      },
      {
        timestamp: now - 1000,
        kind: 'SpotLockScreenWidget',
        success: true,
      },
      {
        timestamp: now - 2000,
        kind: 'SpotLockScreenWidget',
        success: true,
      },
    ];

    const { getAllByLabelText } = render(<ReloadEventLog entries={entries} />);

    const rows = getAllByLabelText(/SpotLockScreenWidget/i);

    // Check that entries are rendered (most recent first is the expected order from props)
    expect(rows.length).toBe(3);

    // The first row should have the most recent timestamp in its label
    expect(rows[0].props.accessibilityLabel).toMatch(
      new RegExp(new Date(now).toLocaleTimeString()),
    );
  });

  it('does NOT enforce 10-cap itself (renders whatever it receives)', () => {
    const entries: ReloadEvent[] = Array.from({ length: 15 }, (_, i) => ({
      timestamp: Date.now() - i * 1000,
      kind: 'SpotLockScreenWidget',
      success: true,
    }));

    const { getAllByText } = render(<ReloadEventLog entries={entries} />);

    // Should render all 15 entries (caller is responsible for capping)
    const rows = getAllByText(/SpotLockScreenWidget/i);
    expect(rows.length).toBe(15);
  });
});
