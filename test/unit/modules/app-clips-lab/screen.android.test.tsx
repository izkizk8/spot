/**
 * Unit tests: app-clips-lab Android screen.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import AppClipsLabAndroid from '@/modules/app-clips-lab/screen.android';

describe('app-clips-lab screen (Android)', () => {
  it('renders only the IOSOnlyBanner', () => {
    const { getByTestId, queryByText } = render(<AppClipsLabAndroid />);
    expect(getByTestId('app-clips-ios-only-banner')).toBeTruthy();
    expect(queryByText(/About App Clips/)).toBeNull();
    expect(queryByText(/Invocation Simulator/)).toBeNull();
  });
});
