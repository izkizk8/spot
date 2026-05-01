import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import MapKitLabScreen from '@/modules/mapkit-lab/screen.android';

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('MapKitLabScreen (Android)', () => {
  it('renders MapView and the four tab pressables', async () => {
    render(<MapKitLabScreen />);
    await flush();

    expect(screen.getByTestId('map-view')).toBeTruthy();
    expect(screen.getByTestId('annotations-tab')).toBeTruthy();
    expect(screen.getByTestId('polyline-tab')).toBeTruthy();
    expect(screen.getByTestId('search-tab')).toBeTruthy();
    expect(screen.getByTestId('lookaround-tab')).toBeTruthy();
  });

  it('annotations and polyline tabs render their live panels', async () => {
    render(<MapKitLabScreen />);
    await flush();

    expect(screen.queryByTestId('annotations-panel')).toBeTruthy();
    expect(screen.queryByTestId('add-at-center-button')).toBeTruthy();

    fireEvent.press(screen.getByTestId('polyline-tab'));
    expect(screen.queryByTestId('polyline-panel')).toBeTruthy();
    expect(screen.queryByTestId('polyline-draw-button')).toBeTruthy();
  });

  it('search tab renders the IOSOnlyBanner with reason="search"', async () => {
    render(<MapKitLabScreen />);
    await flush();

    fireEvent.press(screen.getByTestId('search-tab'));
    expect(screen.queryByTestId('search-panel')).toBeTruthy();
    expect(screen.queryByTestId('search-input')).toBeNull();
    expect(screen.getByText(/MKLocalSearch is iOS only/i)).toBeTruthy();
  });

  it('lookaround tab renders the IOSOnlyBanner with reason="lookaround"', async () => {
    render(<MapKitLabScreen />);
    await flush();

    fireEvent.press(screen.getByTestId('lookaround-tab'));
    expect(screen.queryByTestId('lookaround-panel')).toBeTruthy();
    expect(screen.queryByTestId('lookaround-show-button')).toBeNull();
    expect(screen.getByText(/Look Around is iOS only/i)).toBeTruthy();
  });
});
