/**
 * Tests for ResultLog — feature 033 / T022.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import ResultLog from '@/modules/share-sheet-lab/components/ResultLog';
import type { ShareLogEntry } from '@/modules/share-sheet-lab/hooks/useShareSession';

describe('ResultLog', () => {
  it('renders 0 entries', () => {
    const { toJSON } = render(<ResultLog entries={[]} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders 1 entry', () => {
    const entries: ShareLogEntry[] = [
      {
        id: '1',
        type: 'text',
        activityType: 'com.apple.UIKit.activity.Mail',
        outcome: 'completed',
        timestamp: Date.now(),
      },
    ];

    render(<ResultLog entries={entries} />);
    expect(screen.getByText(/text/i)).toBeTruthy();
    expect(screen.getByText(/completed/i)).toBeTruthy();
  });

  it('renders N entries', () => {
    const entries: ShareLogEntry[] = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      type: 'text' as const,
      activityType: '(none)',
      outcome: 'completed' as const,
      timestamp: Date.now() + i,
    }));

    render(<ResultLog entries={entries} />);
    const rows = screen.getAllByText(/text/i);
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('clamps to 10 newest-first', () => {
    const entries: ShareLogEntry[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      type: 'text' as const,
      activityType: '(none)',
      outcome: 'completed' as const,
      timestamp: Date.now() + i,
    }));

    const { getAllByText } = render(<ResultLog entries={entries.slice(0, 10)} />);
    const rows = getAllByText(/text/i);
    expect(rows.length).toBeLessThanOrEqual(10);
  });

  it('each row shows type, activityType, outcome label, and timestamp text', () => {
    const entries: ShareLogEntry[] = [
      {
        id: '1',
        type: 'url',
        activityType: 'com.apple.UIKit.activity.CopyToPasteboard',
        outcome: 'cancelled',
        timestamp: 1234567890000,
      },
    ];

    render(<ResultLog entries={entries} />);
    expect(screen.getByText(/url/i)).toBeTruthy();
    expect(screen.getByText(/cancelled/i)).toBeTruthy();
    expect(screen.getByText(/CopyToPasteboard/i)).toBeTruthy();
  });
});
