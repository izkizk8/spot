/**
 * Tests for SignificantChangesCard component (feature 025)
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { SignificantChangesCard } from '@/modules/core-location-lab/components/SignificantChangesCard';

describe('SignificantChangesCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Location.startLocationUpdatesAsync as jest.Mock).mockResolvedValue(undefined);
    (Location.stopLocationUpdatesAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders explanatory copy regardless of toggle state', () => {
    render(<SignificantChangesCard />);

    // Should have explanatory text about significant location changes - use getAllByText
    expect(
      screen.getAllByText(/significant/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('toggle subscribes to significant location changes when enabled', async () => {
    render(<SignificantChangesCard />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeTruthy();

    await waitFor(async () => {
      fireEvent(toggle, 'valueChange', true);
    });

    await waitFor(() => {
      // Should call startLocationUpdatesAsync with significant changes config
      expect(Location.startLocationUpdatesAsync).toHaveBeenCalled();
    });
  });

  it('toggle unsubscribes when disabled', async () => {
    render(<SignificantChangesCard />);

    const toggle = screen.getByRole('switch');

    // Enable first
    await waitFor(async () => {
      fireEvent(toggle, 'valueChange', true);
    });

    await waitFor(() => {
      expect(Location.startLocationUpdatesAsync).toHaveBeenCalled();
    });

    // Then disable
    await waitFor(async () => {
      fireEvent(toggle, 'valueChange', false);
    });

    await waitFor(() => {
      expect(Location.stopLocationUpdatesAsync).toHaveBeenCalled();
    });
  });

  it('renders events section', () => {
    render(<SignificantChangesCard />);

    // Should have an events section - use specific text to avoid multiple matches
    expect(screen.getByText('Events')).toBeTruthy();
  });

  it('displays subscribed status when active', async () => {
    render(<SignificantChangesCard />);

    const toggle = screen.getByRole('switch');
    
    await waitFor(async () => {
      fireEvent(toggle, 'valueChange', true);
    });

    await waitFor(() => {
      // Check for the specific subscribed text
      expect(screen.getByText(/Subscribed/)).toBeTruthy();
    });
  });
});
