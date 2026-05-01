import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import MapKitLabScreen from '@/modules/mapkit-lab/screen';

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('MapKitLabScreen (iOS / default)', () => {
  it('renders MapView, MapToolbar, BottomTabs, and PermissionsCard', async () => {
    render(<MapKitLabScreen />);
    await flush();

    expect(screen.getByTestId('map-view')).toBeTruthy();
    expect(screen.getByTestId('maptype-segmented-control')).toBeTruthy();
    expect(screen.getByTestId('annotations-tab')).toBeTruthy();
    expect(screen.getByTestId('polyline-tab')).toBeTruthy();
    expect(screen.getByTestId('search-tab')).toBeTruthy();
    expect(screen.getByTestId('lookaround-tab')).toBeTruthy();
    expect(screen.getByTestId('permissions-status-row')).toBeTruthy();
  });

  it('shows the AnnotationsPanel by default and reaches the other three through BottomTabs', async () => {
    render(<MapKitLabScreen />);
    await flush();

    expect(screen.queryByTestId('annotations-panel')).toBeTruthy();

    fireEvent.press(screen.getByTestId('polyline-tab'));
    expect(screen.queryByTestId('polyline-panel')).toBeTruthy();

    fireEvent.press(screen.getByTestId('search-tab'));
    expect(screen.queryByTestId('search-panel')).toBeTruthy();

    fireEvent.press(screen.getByTestId('lookaround-tab'));
    expect(screen.queryByTestId('lookaround-panel')).toBeTruthy();

    fireEvent.press(screen.getByTestId('annotations-tab'));
    expect(screen.queryByTestId('annotations-panel')).toBeTruthy();
  });
});
