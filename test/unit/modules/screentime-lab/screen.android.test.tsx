/**
 * @file T039 — Android screen test (FR-010).
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('@/native/screentime', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => false),
    entitlementsAvailable: jest.fn(async () => false),
    requestAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(),
    pickActivity: jest.fn(),
    applyShielding: jest.fn(),
    clearShielding: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
  },
}));

import bridge from '@/native/screentime';
import ScreenTimeLabScreen from '@/modules/screentime-lab/screen.android';

describe('Screen Time Lab (Android variant)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Screen Time API is iOS-only" banner', () => {
    const { getByText } = render(<ScreenTimeLabScreen />);
    expect(getByText(/Screen Time API is iOS-only/)).toBeTruthy();
  });

  it('renders all four cards with disabled buttons', () => {
    const { getByLabelText } = render(<ScreenTimeLabScreen />);
    expect(getByLabelText('Authorization card')).toBeTruthy();
    expect(getByLabelText('Activity picker card')).toBeTruthy();
    expect(getByLabelText('Shielding card')).toBeTruthy();
    expect(getByLabelText('Monitoring card')).toBeTruthy();
    expect(getByLabelText('Request Authorization').props.accessibilityState?.disabled).toBe(true);
    expect(getByLabelText('Pick apps & categories').props.accessibilityState?.disabled).toBe(true);
    expect(getByLabelText('Apply Shielding').props.accessibilityState?.disabled).toBe(true);
    expect(getByLabelText('Start daily monitor').props.accessibilityState?.disabled).toBe(true);
  });

  it('never invokes any async bridge method on mount or button press', async () => {
    const { getByLabelText } = render(<ScreenTimeLabScreen />);
    await act(async () => {
      fireEvent.press(getByLabelText('Request Authorization'));
      fireEvent.press(getByLabelText('Pick apps & categories'));
      fireEvent.press(getByLabelText('Apply Shielding'));
      fireEvent.press(getByLabelText('Start daily monitor'));
    });
    expect(bridge.requestAuthorization).not.toHaveBeenCalled();
    expect(bridge.pickActivity).not.toHaveBeenCalled();
    expect(bridge.applyShielding).not.toHaveBeenCalled();
    expect(bridge.startMonitoring).not.toHaveBeenCalled();
    expect(bridge.entitlementsAvailable).not.toHaveBeenCalled();
  });
});
