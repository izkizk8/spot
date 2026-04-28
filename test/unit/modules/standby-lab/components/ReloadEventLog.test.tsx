import React from 'react';
import { render } from '@testing-library/react-native';

import { ReloadEventLog, type ReloadEvent } from '@/modules/standby-lab/components/ReloadEventLog';

describe('ReloadEventLog (standby-lab)', () => {
  it('renders empty state when given entries: []', () => {
    const { getByText } = render(<ReloadEventLog entries={[]} />);
    expect(getByText(/no.*push/i)).toBeTruthy();
  });

  it('renders one row per entry with timestamp, kind, and outcome', () => {
    const entries: ReloadEvent[] = [
      { timestamp: Date.now(), kind: 'SpotStandByWidget', success: true },
      {
        timestamp: Date.now() - 1000,
        kind: 'SpotStandByWidget',
        success: false,
        error: 'Test error',
      },
    ];
    const { getAllByText } = render(<ReloadEventLog entries={entries} />);
    expect(getAllByText(/SpotStandByWidget/).length).toBe(2);
    expect(getAllByText(/✓/).length).toBeGreaterThanOrEqual(1);
    expect(getAllByText(/✗/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 10 entries when given exactly 10', () => {
    const entries: ReloadEvent[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() - i * 1000,
      kind: 'SpotStandByWidget',
      success: i % 2 === 0,
    }));
    const { getAllByText } = render(<ReloadEventLog entries={entries} />);
    expect(getAllByText(/SpotStandByWidget/).length).toBe(10);
  });

  it('success vs failure entries are visually distinguished', () => {
    const entries: ReloadEvent[] = [
      { timestamp: Date.now(), kind: 'SpotStandByWidget', success: true },
      {
        timestamp: Date.now() - 1000,
        kind: 'SpotStandByWidget',
        success: false,
        error: 'Failed',
      },
    ];
    const { getAllByLabelText } = render(<ReloadEventLog entries={entries} />);
    expect(getAllByLabelText(/success/i).length).toBeGreaterThanOrEqual(1);
    expect(getAllByLabelText(/fail|error/i).length).toBeGreaterThanOrEqual(1);
  });

  it('most recent entry appears first', () => {
    const now = Date.now();
    const entries: ReloadEvent[] = [
      { timestamp: now, kind: 'SpotStandByWidget', success: true },
      { timestamp: now - 1000, kind: 'SpotStandByWidget', success: true },
      { timestamp: now - 2000, kind: 'SpotStandByWidget', success: true },
    ];
    const { getAllByLabelText } = render(<ReloadEventLog entries={entries} />);
    const rows = getAllByLabelText(/SpotStandByWidget/);
    expect(rows.length).toBe(3);
    expect(rows[0].props.accessibilityLabel).toMatch(
      new RegExp(new Date(now).toLocaleTimeString()),
    );
  });

  it('every entry kind equals SpotStandByWidget when fed real fixtures', () => {
    const entries: ReloadEvent[] = [
      { timestamp: 1, kind: 'SpotStandByWidget', success: true },
      { timestamp: 2, kind: 'SpotStandByWidget', success: false, error: 'x' },
    ];
    expect(entries.every((e) => e.kind === 'SpotStandByWidget')).toBe(true);
    const { getAllByText } = render(<ReloadEventLog entries={entries} />);
    expect(getAllByText(/SpotStandByWidget/).length).toBe(2);
  });

  it('does NOT enforce 10-cap itself (renders whatever it receives)', () => {
    const entries: ReloadEvent[] = Array.from({ length: 15 }, (_, i) => ({
      timestamp: Date.now() - i * 1000,
      kind: 'SpotStandByWidget',
      success: true,
    }));
    const { getAllByText } = render(<ReloadEventLog entries={entries} />);
    expect(getAllByText(/SpotStandByWidget/).length).toBe(15);
  });
});
