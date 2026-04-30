/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import LidarRoomplanLabWeb from '@/modules/lidar-roomplan-lab/screen.web';

describe('lidar-roomplan-lab screen (Web)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<LidarRoomplanLabWeb />);
    expect(getByTestId('roomplan-ios-only-banner')).toBeTruthy();
  });
});
