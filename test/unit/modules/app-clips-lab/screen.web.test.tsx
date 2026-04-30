/**
 * Unit tests: app-clips-lab Web screen.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import AppClipsLabWeb from '@/modules/app-clips-lab/screen.web';

describe('app-clips-lab screen (Web)', () => {
  it('renders only the IOSOnlyBanner', () => {
    const { getByTestId, queryByText } = render(<AppClipsLabWeb />);
    expect(getByTestId('app-clips-ios-only-banner')).toBeTruthy();
    expect(queryByText(/About App Clips/)).toBeNull();
    expect(queryByText(/Invocation Simulator/)).toBeNull();
  });
});
