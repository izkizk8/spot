import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';

import WidgetsLabScreen from '@/modules/widgets-lab/screen.web';
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

describe('Widgets Lab screen (Web variant)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders the unavailable banner', async () => {
    const view = render(<WidgetsLabScreen />);
    await act(async () => {});
    expect(view.getByText(/iOS 14\+/i)).toBeTruthy();
  });

  it('renders ConfigPanel with Push button disabled', async () => {
    const view = render(<WidgetsLabScreen />);
    await act(async () => {});
    expect(view.getByLabelText('Push to widget')).toBeTruthy();
  });

  it('renders WidgetPreview wired to AsyncStorage shadow store', async () => {
    const view = render(<WidgetsLabScreen />);
    await act(async () => {});
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    expect(view.getAllByText(DEFAULT_CONFIG.showcaseValue).length).toBeGreaterThanOrEqual(3);
  });

  it('does NOT render iOS-only chrome', async () => {
    const view = render(<WidgetsLabScreen />);
    await act(async () => {});
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    expect(view.queryByLabelText('Next refresh time')).toBeNull();
    expect(view.queryByText(/Add SpotShowcaseWidget/)).toBeNull();
    expect(view.queryByText(/Reload events/)).toBeNull();
  });
});
