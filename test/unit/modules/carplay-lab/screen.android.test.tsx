/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import CarPlayLabAndroid from '@/modules/carplay-lab/screen.android';

describe('carplay-lab screen (Android)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<CarPlayLabAndroid />);
    expect(getByTestId('carplay-ios-only-banner')).toBeTruthy();
  });

  it('does not mount any iOS-only cards', () => {
    const { queryByTestId } = render(<CarPlayLabAndroid />);
    expect(queryByTestId('carplay-entitlement-banner')).toBeNull();
    expect(queryByTestId('carplay-scene-composer')).toBeNull();
    expect(queryByTestId('carplay-template-preview')).toBeNull();
  });
});
