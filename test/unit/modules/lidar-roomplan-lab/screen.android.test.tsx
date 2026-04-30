/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import LidarRoomplanLabAndroid from '@/modules/lidar-roomplan-lab/screen.android';

describe('lidar-roomplan-lab screen (Android)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<LidarRoomplanLabAndroid />);
    expect(getByTestId('roomplan-ios-only-banner')).toBeTruthy();
  });
});
