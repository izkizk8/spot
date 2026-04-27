/**
 * @file T040 — Web screen test (FR-010).
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
import ScreenTimeLabScreen from '@/modules/screentime-lab/screen.web';

describe('Screen Time Lab (Web variant)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the iOS-only banner', () => {
    const { getByText } = render(<ScreenTimeLabScreen />);
    expect(getByText(/Screen Time API is iOS-only/)).toBeTruthy();
  });

  it('renders all four cards with disabled controls', () => {
    const { getByLabelText } = render(<ScreenTimeLabScreen />);
    expect(getByLabelText('Authorization card')).toBeTruthy();
    expect(getByLabelText('Activity picker card')).toBeTruthy();
    expect(getByLabelText('Shielding card')).toBeTruthy();
    expect(getByLabelText('Monitoring card')).toBeTruthy();
    expect(getByLabelText('Request Authorization').props.accessibilityState?.disabled).toBe(true);
    expect(getByLabelText('Stop monitor').props.accessibilityState?.disabled).toBe(true);
  });

  it('never invokes the bridge', async () => {
    const { getByLabelText } = render(<ScreenTimeLabScreen />);
    await act(async () => {
      fireEvent.press(getByLabelText('Request Authorization'));
      fireEvent.press(getByLabelText('Pick apps & categories'));
    });
    expect(bridge.requestAuthorization).not.toHaveBeenCalled();
    expect(bridge.pickActivity).not.toHaveBeenCalled();
  });
});
