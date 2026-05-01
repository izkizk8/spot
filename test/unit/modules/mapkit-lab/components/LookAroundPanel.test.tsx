import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  LookAroundPanel,
  type LookAroundBridge,
} from '@/modules/mapkit-lab/components/LookAroundPanel';
import type { Region } from '@/modules/mapkit-lab/landmarks';

const REGION: Region = { lat: 37.33, lng: -122.03, latDelta: 0.1, lngDelta: 0.1 };

function makeBridge(impl: LookAroundBridge['presentLookAround']): LookAroundBridge {
  return { presentLookAround: jest.fn(impl) };
}

function renderPanel(overrides: Partial<React.ComponentProps<typeof LookAroundPanel>> = {}) {
  const props = {
    region: REGION,
    bridge: makeBridge(async () => ({ shown: true })),
    iosVersionAtLeast16: true,
    ...overrides,
  };
  const utils = render(<LookAroundPanel {...props} />);
  return { ...utils, props };
}

describe('LookAroundPanel', () => {
  it('renders IOSOnlyBanner with ios-version copy when iosVersionAtLeast16 is false', () => {
    renderPanel({ iosVersionAtLeast16: false });
    expect(screen.getByText(/iOS 16\+/i)).toBeTruthy();
    expect(screen.queryByTestId('lookaround-show-button')).toBeNull();
  });

  it('renders the action button when iosVersionAtLeast16 is true', () => {
    renderPanel({ iosVersionAtLeast16: true });
    expect(screen.getByTestId('lookaround-show-button')).toBeTruthy();
  });

  it('calls bridge.presentLookAround with region.lat and region.lng on press', async () => {
    const bridge = makeBridge(async () => ({ shown: true }));
    renderPanel({ bridge });

    await act(async () => {
      fireEvent.press(screen.getByTestId('lookaround-show-button'));
    });

    expect(bridge.presentLookAround).toHaveBeenCalledTimes(1);
    expect(bridge.presentLookAround).toHaveBeenCalledWith(REGION.lat, REGION.lng);
  });

  it('shows the no-imagery copy when bridge resolves with shown=false', async () => {
    const bridge = makeBridge(async () => ({ shown: false }));
    renderPanel({ bridge });

    await act(async () => {
      fireEvent.press(screen.getByTestId('lookaround-show-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('lookaround-no-imagery')).toHaveTextContent(
        /No Look Around imagery here/i,
      );
    });
  });

  it('renders an inline error with error.message when the bridge throws', async () => {
    const bridge = makeBridge(async () => {
      throw new Error('lookaround-failed');
    });
    renderPanel({ bridge });

    await act(async () => {
      fireEvent.press(screen.getByTestId('lookaround-show-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('lookaround-error')).toHaveTextContent('lookaround-failed');
    });
    expect(screen.queryByTestId('lookaround-no-imagery')).toBeNull();
  });
});
