/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/carplay-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (carplay)', () => {
  it('renders with the expected testID', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('carplay-ios-only-banner')).toBeTruthy();
  });

  it('explains CarPlay is iOS-only', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/iOS-only Apple framework/i)).toBeTruthy();
  });

  it('mentions the Xcode CarPlay simulator', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/Xcode CarPlay simulator/i)).toBeTruthy();
  });

  it('is a leaf renderable component', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
    expect(typeof fireEvent.press).toBe('function');
  });
});
