/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/lidar-roomplan-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (LiDAR / RoomPlan)', () => {
  it('renders the banner card', () => {
    const { getByTestId, getAllByText } = render(<IOSOnlyBanner />);
    expect(getByTestId('roomplan-ios-only-banner')).toBeTruthy();
    expect(getAllByText(/RoomPlan/).length).toBeGreaterThan(0);
    expect(getAllByText(/LiDAR/).length).toBeGreaterThan(0);
  });
});
