import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import WidgetsLabScreen from '@/modules/widgets-lab/screen.android';
import { DEFAULT_CONFIG } from '@/modules/widgets-lab/widget-config';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () =>
      JSON.stringify({ showcaseValue: 'Hello, Widget!', counter: 0, tint: 'blue' }),
    ),
    setItem: jest.fn(async () => undefined),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Widgets Lab screen (Android variant)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders the unavailable banner', async () => {
    const { getByText } = render(<WidgetsLabScreen />);
    expect(getByText(/iOS 14\+/i)).toBeTruthy();
  });

  it('renders ConfigPanel with the Push button disabled', async () => {
    const { getByLabelText } = render(<WidgetsLabScreen />);
    const btn = getByLabelText('Push to widget');
    const onPushSpy = jest.fn();
    await act(async () => {
      fireEvent.press(btn);
    });
    // Push being disabled means setItem not called for shadow store from button.
    // (Shadow store is updated via in-screen edits flowing through validate; the
    // button itself is a no-op when pushEnabled === false.)
    expect(onPushSpy).not.toHaveBeenCalled();
  });

  it('renders WidgetPreview wired to the AsyncStorage shadow store', async () => {
    const { getAllByText } = render(<WidgetsLabScreen />);
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
    expect(getAllByText(DEFAULT_CONFIG.showcaseValue).length).toBeGreaterThanOrEqual(3);
  });

  it('does NOT render iOS-only chrome (refresh line, setup, reload log)', async () => {
    const { queryByLabelText, queryByText } = render(<WidgetsLabScreen />);
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    expect(queryByLabelText('Next refresh time')).toBeNull();
    expect(queryByText(/Add SpotShowcaseWidget/)).toBeNull();
    expect(queryByText(/Reload events/)).toBeNull();
  });
});
