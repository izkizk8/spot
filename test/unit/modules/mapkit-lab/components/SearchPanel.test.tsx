import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  SearchPanel,
  type MapKitSearchBridge,
  type SearchResult,
} from '@/modules/mapkit-lab/components/SearchPanel';
import type { Region } from '@/modules/mapkit-lab/landmarks';

const REGION: Region = { lat: 37.33, lng: -122.03, latDelta: 0.1, lngDelta: 0.1 };

function makeBridge(impl: MapKitSearchBridge['searchLocations']): MapKitSearchBridge {
  return { searchLocations: jest.fn(impl) };
}

function renderPanel(overrides: Partial<React.ComponentProps<typeof SearchPanel>> = {}) {
  const props = {
    region: REGION,
    onResultPress: jest.fn(),
    bridge: makeBridge(async () => []),
    ...overrides,
  };
  const utils = render(<SearchPanel {...props} />);
  return { ...utils, props };
}

describe('SearchPanel', () => {
  it('does not call bridge.searchLocations when submitting an empty query', () => {
    const bridge = makeBridge(async () => []);
    renderPanel({ bridge });

    fireEvent.press(screen.getByTestId('search-submit-button'));

    expect(bridge.searchLocations).not.toHaveBeenCalled();
  });

  it('does not call bridge.searchLocations for whitespace-only query', () => {
    const bridge = makeBridge(async () => []);
    renderPanel({ bridge });

    fireEvent.changeText(screen.getByTestId('search-input'), '   ');
    fireEvent.press(screen.getByTestId('search-submit-button'));

    expect(bridge.searchLocations).not.toHaveBeenCalled();
  });

  it('calls bridge.searchLocations with the query and region on non-empty submit', async () => {
    const results: SearchResult[] = [{ name: 'Cafe One', address: '1 First St', lat: 1, lng: 2 }];
    const bridge = makeBridge(async () => results);
    renderPanel({ bridge });

    fireEvent.changeText(screen.getByTestId('search-input'), 'cafe');
    await act(async () => {
      fireEvent.press(screen.getByTestId('search-submit-button'));
    });

    expect(bridge.searchLocations).toHaveBeenCalledTimes(1);
    expect(bridge.searchLocations).toHaveBeenCalledWith('cafe', REGION);
  });

  it('renders each result as a pressable row and forwards presses to onResultPress', async () => {
    const results: SearchResult[] = [
      { name: 'Cafe One', address: '1 First St', lat: 1, lng: 2 },
      { name: 'Cafe Two', address: '2 Second St', lat: 3, lng: 4 },
    ];
    const bridge = makeBridge(async () => results);
    const { props } = renderPanel({ bridge });

    fireEvent.changeText(screen.getByTestId('search-input'), 'cafe');
    await act(async () => {
      fireEvent.press(screen.getByTestId('search-submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-result-0')).toBeTruthy();
      expect(screen.getByTestId('search-result-1')).toBeTruthy();
    });

    expect(screen.getByText('Cafe One')).toBeTruthy();
    expect(screen.getByText('Cafe Two')).toBeTruthy();

    fireEvent.press(screen.getByTestId('search-result-1'));
    expect(props.onResultPress).toHaveBeenCalledTimes(1);
    expect(props.onResultPress).toHaveBeenCalledWith(results[1]);
  });

  it('renders the empty state when results come back empty', async () => {
    const bridge = makeBridge(async () => []);
    renderPanel({ bridge });

    fireEvent.changeText(screen.getByTestId('search-input'), 'nothing');
    await act(async () => {
      fireEvent.press(screen.getByTestId('search-submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-empty-state')).toBeTruthy();
    });
  });

  it('surfaces error.message inline when the bridge throws', async () => {
    const bridge = makeBridge(async () => {
      throw new Error('boom');
    });
    renderPanel({ bridge });

    fireEvent.changeText(screen.getByTestId('search-input'), 'oops');
    await act(async () => {
      fireEvent.press(screen.getByTestId('search-submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-error')).toHaveTextContent('boom');
    });
    expect(screen.queryByTestId('search-results')).toBeNull();
  });

  it('shows a loading indicator while the bridge promise is pending', async () => {
    const mockResults: SearchResult[] = [];
    let resolveSearch: ((results: SearchResult[]) => void) | null = null;

    const searchPromise = new Promise<SearchResult[]>((resolve) => {
      resolveSearch = resolve;
    });

    const bridge = makeBridge(() => searchPromise);
    renderPanel({ bridge });

    fireEvent.changeText(screen.getByTestId('search-input'), 'wait');
    fireEvent.press(screen.getByTestId('search-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('search-loading')).toBeTruthy();
    });

    // Resolve the promise
    if (resolveSearch) {
      await act(async () => {
        resolveSearch!(mockResults);
        await searchPromise;
      });
    }

    await waitFor(() => {
      expect(screen.queryByTestId('search-loading')).toBeNull();
    });
  });
});
