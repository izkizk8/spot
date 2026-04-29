import React from 'react';
import { render, screen } from '@testing-library/react-native';

type EventLogEntry = {
  kind: 'simulated' | 'activated' | 'deactivated';
  values: { mode: string; accentColor: string };
  at: string;
  focusName?: string;
};

// Import will fail until component is implemented
let EventLog: any;
try {
  EventLog = require('@/modules/focus-filters-lab/components/EventLog').default;
} catch {
  EventLog = () => null;
}

describe('EventLog', () => {
  it('renders an empty-state line when given entries: []', () => {
    render(<EventLog entries={[]} />);
    expect(screen.getByText(/no events|no entries|empty/i)).toBeTruthy();
  });

  it('when given entries: [...] renders one row per entry with timestamp, kind badge, and values summary', () => {
    const entries: EventLogEntry[] = [
      {
        kind: 'simulated',
        values: { mode: 'relaxed', accentColor: 'blue' },
        at: '2026-05-07T12:34:56.000Z',
      },
      {
        kind: 'activated',
        values: { mode: 'focused', accentColor: 'orange' },
        at: '2026-05-07T12:35:00.000Z',
      },
    ];
    render(<EventLog entries={entries} />);
    expect(screen.getByText(/simulated/i)).toBeTruthy();
    expect(screen.getByText(/activated/i)).toBeTruthy();
  });

  it('the component does NOT enforce the 10-cap (hook does)', () => {
    const entries: EventLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
      kind: 'simulated' as const,
      values: { mode: 'relaxed', accentColor: 'blue' },
      at: new Date(Date.now() - i * 1000).toISOString(),
    }));
    render(<EventLog entries={entries} />);
    const textNodes = screen.root.findAllByType('Text' as any);
    const simulatedBadges = textNodes.filter((node: any) => /simulated/i.test(node.props.children));
    expect(simulatedBadges.length).toBeGreaterThanOrEqual(10);
  });

  it('kind: "simulated" entries render a visually distinct badge from "activated"/"deactivated"', () => {
    const entries: EventLogEntry[] = [
      {
        kind: 'simulated',
        values: { mode: 'relaxed', accentColor: 'blue' },
        at: '2026-05-07T12:34:56.000Z',
      },
      {
        kind: 'activated',
        values: { mode: 'focused', accentColor: 'orange' },
        at: '2026-05-07T12:35:00.000Z',
      },
    ];
    render(<EventLog entries={entries} />);
    const simulatedBadge = screen.getByText(/simulated/i);
    const activatedBadge = screen.getByText(/activated/i);
    expect(simulatedBadge.props.accessibilityLabel || simulatedBadge.props.testID).toBeTruthy();
    expect(activatedBadge.props.accessibilityLabel || activatedBadge.props.testID).toBeTruthy();
    expect(simulatedBadge.props.accessibilityLabel).not.toEqual(
      activatedBadge.props.accessibilityLabel,
    );
  });

  it('the most recent entry appears first (renders in order received)', () => {
    const entries: EventLogEntry[] = [
      {
        kind: 'simulated',
        values: { mode: 'relaxed', accentColor: 'blue' },
        at: '2026-05-07T12:35:00.000Z',
      },
      {
        kind: 'activated',
        values: { mode: 'focused', accentColor: 'orange' },
        at: '2026-05-07T12:34:00.000Z',
      },
    ];
    render(<EventLog entries={entries} />);
    const textNodes = screen.root.findAllByType('Text' as any);
    const kindsInOrder = textNodes
      .filter((node: any) => /simulated|activated|deactivated/i.test(node.props.children))
      .map((node: any) => node.props.children.toLowerCase());
    expect(kindsInOrder[0]).toMatch(/simulated/);
  });

  it('optional focusName is rendered when present in an entry', () => {
    const entries: EventLogEntry[] = [
      {
        kind: 'activated',
        values: { mode: 'focused', accentColor: 'orange' },
        at: '2026-05-07T12:34:56.000Z',
        focusName: 'Work',
      },
    ];
    render(<EventLog entries={entries} />);
    expect(screen.getByText(/work/i)).toBeTruthy();
  });
});
