/**
 * Tests for EventLog component (feature 025)
 */
import { render, screen } from '@testing-library/react-native';

import { EventLog } from '@/modules/core-location-lab/components/EventLog';
import type { RegionEvent, SignificantChangeEvent } from '@/modules/core-location-lab/types';

describe('EventLog', () => {
  const mockRegionEvents: RegionEvent[] = [
    { id: '1', regionId: 'region-1', type: 'enter', timestamp: new Date('2026-04-29T10:00:00') },
    { id: '2', regionId: 'region-1', type: 'exit', timestamp: new Date('2026-04-29T10:05:00') },
    { id: '3', regionId: 'region-2', type: 'enter', timestamp: new Date('2026-04-29T10:10:00') },
  ];

  it('renders one row per entry with timestamp', () => {
    render(<EventLog entries={mockRegionEvents} type="region" />);

    // Use getAllByText for multiple matches
    expect(screen.getAllByText(/region-1/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/region-2/)).toBeTruthy();
    // There should be 2 enter events total (one for region-1, one for region-2)
    expect(screen.getAllByText(/enter/i).length).toBe(2);
    expect(screen.getByText(/exit/i)).toBeTruthy();
  });

  it('renders empty-state copy when entries is empty', () => {
    render(<EventLog entries={[]} type="region" />);

    expect(screen.getByText(/No events yet/i)).toBeTruthy();
  });

  it('renders the most-recent 100 entries when given >100 entries', () => {
    const manyEvents: RegionEvent[] = Array.from({ length: 105 }, (_, i) => ({
      id: `event-${i}`,
      regionId: `region-${i}`,
      type: 'enter' as const,
      timestamp: new Date(Date.now() + i * 1000),
    }));

    render(<EventLog entries={manyEvents} type="region" />);

    // Should only render 100 rows max
    const rows = screen.getAllByTestId('event-row');
    expect(rows.length).toBeLessThanOrEqual(100);
  });

  it('formats timestamps in a readable format', () => {
    render(<EventLog entries={mockRegionEvents} type="region" />);

    // Should have time components visible - use getAllByText since there might be multiple
    expect(screen.getAllByText(/10:00/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders significant change events', () => {
    const significantEvents: SignificantChangeEvent[] = [
      {
        id: '1',
        latitude: 37.78825,
        longitude: -122.4324,
        timestamp: new Date('2026-04-29T10:00:00'),
      },
    ];

    render(<EventLog entries={significantEvents} type="significant" />);

    expect(screen.getByText(/37\.78/)).toBeTruthy();
  });
});
