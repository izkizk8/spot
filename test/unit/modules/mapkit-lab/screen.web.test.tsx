import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import MapKitLabScreen from '@/modules/mapkit-lab/screen.web';

const lookAroundMock = jest.requireActual('@test/__mocks__/native-lookaround');
const searchMock = jest.requireActual('@test/__mocks__/native-mapkit-search');

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('MapKitLabScreen (Web)', () => {
  it('renders MapPlaceholder instead of MapView', async () => {
    render(<MapKitLabScreen />);
    await flush();

    expect(screen.queryByTestId('map-view')).toBeNull();
    expect(screen.getByText(/Map view not available on web/i)).toBeTruthy();
  });

  it('mounts the toolbar and the bottom panel strip', async () => {
    render(<MapKitLabScreen />);
    await flush();

    expect(screen.getByTestId('maptype-segmented-control')).toBeTruthy();
    expect(screen.getByTestId('recenter-button')).toBeTruthy();
    expect(screen.getByTestId('annotations-tab')).toBeTruthy();
    expect(screen.getByTestId('polyline-tab')).toBeTruthy();
    expect(screen.getByTestId('search-tab')).toBeTruthy();
    expect(screen.getByTestId('lookaround-tab')).toBeTruthy();
  });

  it('search and lookaround tabs render IOSOnlyBanner', async () => {
    render(<MapKitLabScreen />);
    await flush();

    fireEvent.press(screen.getByTestId('search-tab'));
    expect(screen.getByText(/MKLocalSearch is iOS only/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('lookaround-tab'));
    expect(screen.getByText(/Look Around is iOS only/i)).toBeTruthy();
  });

  it('Recenter / Add at center / Draw sample loop do not throw and do not call native bridges', async () => {
    // Spy on the native mocks so we can assert no bridge call happened.
    const searchCalls = jest.fn();
    const lookAroundCalls = jest.fn();
    searchMock.__setSearchModule({
      search: (...args: unknown[]) => {
        searchCalls(...args);
        return Promise.resolve([]);
      },
    });
    lookAroundMock.__setLookAroundModule({
      presentLookAround: (...args: unknown[]) => {
        lookAroundCalls(...args);
        return Promise.resolve({ shown: true });
      },
    });

    render(<MapKitLabScreen />);
    await flush();

    expect(() => fireEvent.press(screen.getByTestId('recenter-button'))).not.toThrow();
    await flush();

    fireEvent.press(screen.getByTestId('polyline-tab'));
    expect(() => fireEvent.press(screen.getByTestId('polyline-draw-button'))).not.toThrow();

    fireEvent.press(screen.getByTestId('annotations-tab'));
    expect(() => fireEvent.press(screen.getByTestId('add-at-center-button'))).not.toThrow();

    await flush();
    expect(searchCalls).not.toHaveBeenCalled();
    expect(lookAroundCalls).not.toHaveBeenCalled();
  });
});
