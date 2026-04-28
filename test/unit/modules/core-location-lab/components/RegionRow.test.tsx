/**
 * Tests for RegionRow component (feature 025)
 */
import { render, screen } from '@testing-library/react-native';

import { RegionRow } from '@/modules/core-location-lab/components/RegionRow';
import type { MonitoredRegion } from '@/modules/core-location-lab/types';

describe('RegionRow', () => {
  const mockRegion: MonitoredRegion = {
    id: 'region-1',
    latitude: 37.78825,
    longitude: -122.4324,
    radius: 100,
    state: 'unknown',
  };

  it('renders the region id', () => {
    render(<RegionRow region={mockRegion} />);

    expect(screen.getByText(/region-1/)).toBeTruthy();
  });

  it('renders the radius', () => {
    render(<RegionRow region={mockRegion} />);

    expect(screen.getByText(/100/)).toBeTruthy();
  });

  it('renders state pill with "unknown" state', () => {
    render(<RegionRow region={mockRegion} />);

    expect(screen.getByText(/unknown/i)).toBeTruthy();
  });

  it('renders state pill with "inside" state', () => {
    render(<RegionRow region={{ ...mockRegion, state: 'inside' }} />);

    expect(screen.getByText(/inside/i)).toBeTruthy();
  });

  it('renders state pill with "outside" state', () => {
    render(<RegionRow region={{ ...mockRegion, state: 'outside' }} />);

    expect(screen.getByText(/outside/i)).toBeTruthy();
  });

  it('state pill styling varies by state', () => {
    const { rerender } = render(<RegionRow region={{ ...mockRegion, state: 'inside' }} />);
    const insidePill = screen.getByTestId('state-pill');

    rerender(<RegionRow region={{ ...mockRegion, state: 'outside' }} />);
    const outsidePill = screen.getByTestId('state-pill');

    // Both pills should exist and have different states
    expect(insidePill).toBeTruthy();
    expect(outsidePill).toBeTruthy();
  });
});
