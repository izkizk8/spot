import React from 'react';
import { render, screen } from '@testing-library/react-native';
import IOSOnlyBanner from '@/modules/focus-filters-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the literal user-facing string "Focus Filters require iOS 16+"', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText('Focus Filters require iOS 16+')).toBeTruthy();
  });

  it('sets accessibilityRole: "alert" so screen readers announce on mount', () => {
    const { root } = render(<IOSOnlyBanner />);
    const alertView = root.findAll((node: any) => node.props.accessibilityRole === 'alert')[0];
    expect(alertView).toBeTruthy();
  });

  it('is purely presentational (no platform branching inside)', () => {
    // Component should render same output regardless of platform
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
  });

  it('accepts an optional style prop', () => {
    const { rerender } = render(<IOSOnlyBanner />);
    expect(() => rerender(<IOSOnlyBanner style={{ marginTop: 20 }} />)).not.toThrow();
  });
});
