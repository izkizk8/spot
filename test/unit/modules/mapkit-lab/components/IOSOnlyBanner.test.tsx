import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { IOSOnlyBanner } from '@/modules/mapkit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders search-specific copy when reason is search', () => {
    render(<IOSOnlyBanner reason='search' />);
    expect(screen.getByText(/MKLocalSearch.*iOS only/i)).toBeTruthy();
  });

  it('renders lookaround-specific copy when reason is lookaround', () => {
    render(<IOSOnlyBanner reason='lookaround' />);
    expect(screen.getByText(/Look Around.*iOS only/i)).toBeTruthy();
  });

  it('renders ios-version-specific copy when reason is ios-version', () => {
    render(<IOSOnlyBanner reason='ios-version' />);
    expect(screen.getByText(/iOS 16\+/i)).toBeTruthy();
  });

  it('does not throw on any reason variant', () => {
    expect(() => render(<IOSOnlyBanner reason='search' />)).not.toThrow();
    expect(() => render(<IOSOnlyBanner reason='lookaround' />)).not.toThrow();
    expect(() => render(<IOSOnlyBanner reason='ios-version' />)).not.toThrow();
  });
});
