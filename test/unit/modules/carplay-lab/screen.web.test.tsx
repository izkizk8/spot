/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import CarPlayLabWeb from '@/modules/carplay-lab/screen.web';

describe('carplay-lab screen (Web)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<CarPlayLabWeb />);
    expect(getByTestId('carplay-ios-only-banner')).toBeTruthy();
  });

  it('does not mount any iOS-only cards', () => {
    const { queryByTestId } = render(<CarPlayLabWeb />);
    expect(queryByTestId('carplay-entitlement-banner')).toBeNull();
    expect(queryByTestId('carplay-scene-composer')).toBeNull();
    expect(queryByTestId('carplay-template-preview')).toBeNull();
  });
});
