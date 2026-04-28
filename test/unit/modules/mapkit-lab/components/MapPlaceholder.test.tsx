import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { MapPlaceholder } from '@/modules/mapkit-lab/components/MapPlaceholder';

describe('MapPlaceholder', () => {
  it('renders the documented placeholder copy', () => {
    render(<MapPlaceholder />);
    expect(screen.getByText(/Map view not available on web/i)).toBeTruthy();
  });

  it('does not throw when mounted', () => {
    expect(() => render(<MapPlaceholder />)).not.toThrow();
  });
});
