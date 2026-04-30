/**
 * @jest-environment jsdom
 */

import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import EntitlementBanner, {
  CARPLAY_CATEGORIES,
  CARPLAY_PORTAL_URL,
} from '@/modules/carplay-lab/components/EntitlementBanner';

describe('EntitlementBanner (carplay)', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as unknown as boolean);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders with the expected testID', () => {
    const { getByTestId } = render(<EntitlementBanner />);
    expect(getByTestId('carplay-entitlement-banner')).toBeTruthy();
  });

  it('lists all six Apple-permitted categories', () => {
    const { getByText } = render(<EntitlementBanner />);
    for (const category of CARPLAY_CATEGORIES) {
      expect(getByText(new RegExp(category))).toBeTruthy();
    }
  });

  it('opens the developer portal URL when the link is pressed', () => {
    const openSpy = Linking.openURL as jest.Mock;
    const { getByTestId } = render(<EntitlementBanner />);
    fireEvent.press(getByTestId('carplay-entitlement-portal-link'));
    expect(openSpy).toHaveBeenCalledWith(CARPLAY_PORTAL_URL);
  });

  it('honours the onOpenPortal override and skips Linking.openURL', () => {
    const openSpy = Linking.openURL as jest.Mock;
    const cb = jest.fn();
    const { getByTestId } = render(<EntitlementBanner onOpenPortal={cb} />);
    fireEvent.press(getByTestId('carplay-entitlement-portal-link'));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });
});
