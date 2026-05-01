/**
 * Tests for IOSOnlyBanner component (feature 025)
 */
import { render, screen } from '@testing-library/react-native';

import { IOSOnlyBanner } from '@/modules/core-location-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders per-reason copy for "region-monitoring" reason', () => {
    render(<IOSOnlyBanner reason='region-monitoring' />);

    expect(screen.getByText(/region monitoring/i)).toBeTruthy();
    expect(screen.getByText(/iOS only/i)).toBeTruthy();
  });

  it('renders a generic message for unknown reasons', () => {
    render(<IOSOnlyBanner reason='unknown-feature' />);

    expect(screen.getByText(/iOS only/i)).toBeTruthy();
  });

  it('renders the iOS indicator icon or text', () => {
    render(<IOSOnlyBanner reason='region-monitoring' />);

    // Should have some visual indicator
    expect(screen.getByTestId('ios-only-banner')).toBeTruthy();
  });
});
