/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import HealthKitLabWeb from '@/modules/healthkit-lab/screen.web';

describe('healthkit-lab screen (web)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<HealthKitLabWeb />);
    expect(getByTestId('healthkit-ios-only-banner')).toBeTruthy();
  });

  it('does not mount any iOS-only cards', () => {
    const { queryByTestId } = render(<HealthKitLabWeb />);
    expect(queryByTestId('healthkit-auth-card')).toBeNull();
    expect(queryByTestId('healthkit-step-card')).toBeNull();
    expect(queryByTestId('healthkit-live-card')).toBeNull();
  });
});
