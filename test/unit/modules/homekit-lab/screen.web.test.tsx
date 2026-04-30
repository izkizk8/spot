/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import HomeKitLabWeb from '@/modules/homekit-lab/screen.web';

describe('homekit-lab screen (Web)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<HomeKitLabWeb />);
    expect(getByTestId('homekit-ios-only-banner')).toBeTruthy();
  });

  it('does not mount any iOS-only cards', () => {
    const { queryByTestId } = render(<HomeKitLabWeb />);
    expect(queryByTestId('homekit-auth-card')).toBeNull();
    expect(queryByTestId('homekit-homes-card')).toBeNull();
    expect(queryByTestId('homekit-live-card')).toBeNull();
  });
});
