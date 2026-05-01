import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { BottomTabs } from '@/modules/mapkit-lab/components/BottomTabs';
import { DEFAULT_FALLBACK_REGION } from '@/modules/mapkit-lab/landmarks';
import type { UseMapState } from '@/modules/mapkit-lab/hooks/useMapState';

function makeState(): UseMapState {
  return {
    mapType: 'standard',
    visibleAnnotationIds: new Set<string>(),
    customAnnotations: [],
    polylinePoints: [],
    region: DEFAULT_FALLBACK_REGION,
    permissionStatus: 'undetermined',
    userLocationEnabled: false,
    toggleAnnotation: jest.fn(),
    addAnnotationAtCenter: jest.fn(),
    drawSampleLoop: jest.fn(),
    clearPolyline: jest.fn(),
    setMapType: jest.fn(),
    setRegion: jest.fn(),
    setPermissionStatus: jest.fn(),
    toggleUserLocation: jest.fn(),
    recenter: jest.fn(async () => {}),
  };
}

const searchBridge = {
  searchLocations: jest.fn(async () => []),
};

const lookAroundBridge = {
  presentLookAround: jest.fn(async () => ({ shown: true })),
};

function renderTabs(overrides: { iosVersionAtLeast16?: boolean } = {}) {
  return render(
    <BottomTabs
      state={makeState()}
      searchBridge={searchBridge}
      lookAroundBridge={lookAroundBridge}
      iosVersionAtLeast16={overrides.iosVersionAtLeast16 ?? true}
    />,
  );
}

describe('BottomTabs', () => {
  it('renders the four tab pressables', () => {
    renderTabs();
    expect(screen.getByTestId('annotations-tab')).toBeTruthy();
    expect(screen.getByTestId('polyline-tab')).toBeTruthy();
    expect(screen.getByTestId('search-tab')).toBeTruthy();
    expect(screen.getByTestId('lookaround-tab')).toBeTruthy();
  });

  it('initial active tab is annotations', () => {
    renderTabs();
    expect(screen.queryByTestId('annotations-panel')).toBeTruthy();
    expect(screen.queryByTestId('polyline-panel')).toBeNull();
    expect(screen.queryByTestId('search-panel')).toBeNull();
    expect(screen.queryByTestId('lookaround-panel')).toBeNull();
  });

  it('tapping polyline-tab swaps the rendered panel', () => {
    renderTabs();
    fireEvent.press(screen.getByTestId('polyline-tab'));
    expect(screen.queryByTestId('polyline-panel')).toBeTruthy();
    expect(screen.queryByTestId('annotations-panel')).toBeNull();
  });

  it('tapping search-tab swaps the rendered panel', () => {
    renderTabs();
    fireEvent.press(screen.getByTestId('search-tab'));
    expect(screen.queryByTestId('search-panel')).toBeTruthy();
    expect(screen.queryByTestId('annotations-panel')).toBeNull();
  });

  it('tapping lookaround-tab swaps the rendered panel', () => {
    renderTabs();
    fireEvent.press(screen.getByTestId('lookaround-tab'));
    expect(screen.queryByTestId('lookaround-panel')).toBeTruthy();
    expect(screen.queryByTestId('annotations-panel')).toBeNull();
  });

  it('tapping annotations-tab returns to annotations panel', () => {
    renderTabs();
    fireEvent.press(screen.getByTestId('polyline-tab'));
    fireEvent.press(screen.getByTestId('annotations-tab'));
    expect(screen.queryByTestId('annotations-panel')).toBeTruthy();
    expect(screen.queryByTestId('polyline-panel')).toBeNull();
  });
});
