import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { DEFAULT_CONFIG } from '@/modules/widgets-lab/widget-config';

jest.mock('@/native/widget-center', () => {
  const config = { showcaseValue: 'Hello, Widget!', counter: 0, tint: 'blue' as const };
  return {
    __esModule: true,
    default: {
      isAvailable: jest.fn(() => true),
      getCurrentConfig: jest.fn(async () => config),
      setConfig: jest.fn(async () => undefined),
      reloadAllTimelines: jest.fn(async () => undefined),
    },
  };
});

import bridge from '@/native/widget-center';
import WidgetsLabScreen from '@/modules/widgets-lab/screen';

describe('Widgets Lab screen (iOS variant)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bridge.isAvailable as jest.Mock).mockReturnValue(true);
    (bridge.getCurrentConfig as jest.Mock).mockResolvedValue(DEFAULT_CONFIG);
    (bridge.setConfig as jest.Mock).mockResolvedValue(undefined);
    (bridge.reloadAllTimelines as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders the orchestrated panels (config + preview + setup + status)', async () => {
    const { getByLabelText } = render(<WidgetsLabScreen />);
    await waitFor(() => {
      expect(getByLabelText('Push to widget')).toBeTruthy();
      expect(getByLabelText('Preview Small')).toBeTruthy();
    });
  });

  it('on Push, calls setConfig then reloadAllTimelines and adds a success log entry', async () => {
    const { getByLabelText, findAllByLabelText } = render(<WidgetsLabScreen />);
    await waitFor(() => expect(bridge.getCurrentConfig).toHaveBeenCalled());
    await act(async () => {
      fireEvent.press(getByLabelText('Push to widget'));
    });
    expect(bridge.setConfig).toHaveBeenCalledTimes(1);
    expect(bridge.reloadAllTimelines).toHaveBeenCalledTimes(1);
    const items = await findAllByLabelText(/^Reload event /);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('on bridge error, dispatches a failure event with the error message', async () => {
    (bridge.reloadAllTimelines as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const { getByLabelText, findByText } = render(<WidgetsLabScreen />);
    await waitFor(() => expect(bridge.getCurrentConfig).toHaveBeenCalled());
    await act(async () => {
      fireEvent.press(getByLabelText('Push to widget'));
    });
    expect(await findByText(/boom/)).toBeTruthy();
  });

  it('hides iOS-only chrome when bridge is unavailable', async () => {
    (bridge.isAvailable as jest.Mock).mockReturnValue(false);
    (bridge.getCurrentConfig as jest.Mock).mockRejectedValue(new Error('na'));
    const { queryByLabelText } = render(<WidgetsLabScreen />);
    await waitFor(() => {
      expect(queryByLabelText('Next refresh time')).toBeNull();
    });
  });
});
