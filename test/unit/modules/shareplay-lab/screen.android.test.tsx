/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SharePlayLabAndroid from '@/modules/shareplay-lab/screen.android';

describe('shareplay-lab screen (Android)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<SharePlayLabAndroid />);
    expect(getByTestId('shareplay-ios-only-banner')).toBeTruthy();
  });
});
