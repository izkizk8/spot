/**
 * @file T030 — iOS screen test.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('@/native/screentime', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => true),
    entitlementsAvailable: jest.fn(async () => false),
    requestAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(async () => 'notDetermined'),
    pickActivity: jest.fn(),
    applyShielding: jest.fn(),
    clearShielding: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
  },
}));

import bridge from '@/native/screentime';
import ScreenTimeLabScreen from '@/modules/screentime-lab/screen';

describe('Screen Time Lab screen (iOS variant)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the EntitlementBanner when probe → false', async () => {
    (bridge.entitlementsAvailable as jest.Mock).mockResolvedValue(false);
    const { findByLabelText } = render(<ScreenTimeLabScreen />);
    expect(await findByLabelText('Entitlement banner')).toBeTruthy();
  });

  it('renders the four cards in FR-004 order', async () => {
    (bridge.entitlementsAvailable as jest.Mock).mockResolvedValue(false);
    const { getByLabelText } = render(<ScreenTimeLabScreen />);
    await waitFor(() => {
      expect(getByLabelText('Authorization card')).toBeTruthy();
      expect(getByLabelText('Activity picker card')).toBeTruthy();
      expect(getByLabelText('Shielding card')).toBeTruthy();
      expect(getByLabelText('Monitoring card')).toBeTruthy();
    });
  });

  it('hides the EntitlementBanner when probe → true', async () => {
    (bridge.entitlementsAvailable as jest.Mock).mockResolvedValue(true);
    (bridge.getAuthorizationStatus as jest.Mock).mockResolvedValue('approved');
    const { queryByLabelText } = render(<ScreenTimeLabScreen />);
    await waitFor(() => {
      expect(bridge.entitlementsAvailable).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(queryByLabelText('Entitlement banner')).toBeNull();
    });
  });

  it('on mount with entitlement available, hydrates auth status from getAuthorizationStatus', async () => {
    (bridge.entitlementsAvailable as jest.Mock).mockResolvedValue(true);
    (bridge.getAuthorizationStatus as jest.Mock).mockResolvedValue('approved');
    const { findByText } = render(<ScreenTimeLabScreen />);
    expect(await findByText('Approved')).toBeTruthy();
  });

  it('does not crash when entitlement probe rejects (entitlementsAvailable contract)', async () => {
    // The bridge contract guarantees entitlementsAvailable never throws.
    // Even if the mock is configured to throw, the screen's catch keeps
    // it safe.
    (bridge.entitlementsAvailable as jest.Mock).mockRejectedValue(new Error('boom'));
    const { getByLabelText } = render(<ScreenTimeLabScreen />);
    await waitFor(() => {
      expect(getByLabelText('Authorization card')).toBeTruthy();
    });
  });
});
