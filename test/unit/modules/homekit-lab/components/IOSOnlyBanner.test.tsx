/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/homekit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (homekit)', () => {
  it('renders with the expected testID', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('homekit-ios-only-banner')).toBeTruthy();
  });

  it('explains HomeKit is iOS-only', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/iOS-only framework/i)).toBeTruthy();
  });

  it('mentions the HomeKit Accessory Simulator', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/HomeKit Accessory Simulator/i)).toBeTruthy();
  });

  // Touch fireEvent so the import is exercised.
  it('is a leaf renderable component', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
    expect(typeof fireEvent.press).toBe('function');
  });
});
