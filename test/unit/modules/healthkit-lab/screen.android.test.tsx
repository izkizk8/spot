/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import HealthKitLabAndroid from '@/modules/healthkit-lab/screen.android';

describe('healthkit-lab screen (Android)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<HealthKitLabAndroid />);
    expect(getByTestId('healthkit-ios-only-banner')).toBeTruthy();
  });

  it('does not mount any iOS-only cards', () => {
    const { queryByTestId } = render(<HealthKitLabAndroid />);
    expect(queryByTestId('healthkit-auth-card')).toBeNull();
    expect(queryByTestId('healthkit-step-card')).toBeNull();
    expect(queryByTestId('healthkit-live-card')).toBeNull();
  });
});
