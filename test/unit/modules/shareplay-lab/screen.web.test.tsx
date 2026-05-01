/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SharePlayLabWeb from '@/modules/shareplay-lab/screen.web';

describe('shareplay-lab screen (Web)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<SharePlayLabWeb />);
    expect(getByTestId('shareplay-ios-only-banner')).toBeTruthy();
  });
});
