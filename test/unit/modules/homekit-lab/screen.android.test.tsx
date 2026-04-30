/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import HomeKitLabAndroid from '@/modules/homekit-lab/screen.android';

describe('homekit-lab screen (Android)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<HomeKitLabAndroid />);
    expect(getByTestId('homekit-ios-only-banner')).toBeTruthy();
  });

  it('does not mount any iOS-only cards', () => {
    const { queryByTestId } = render(<HomeKitLabAndroid />);
    expect(queryByTestId('homekit-auth-card')).toBeNull();
    expect(queryByTestId('homekit-homes-card')).toBeNull();
    expect(queryByTestId('homekit-live-card')).toBeNull();
  });
});
