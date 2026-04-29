/**
 * AndroidRemindersNotice component tests.
 * Feature: 037-eventkit
 */

import { render } from '@testing-library/react-native';
import React from 'react';

describe('AndroidRemindersNotice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Android-limitation copy', () => {
    const {
      AndroidRemindersNotice,
    } = require('@/modules/eventkit-lab/components/AndroidRemindersNotice');

    const { getByText } = render(<AndroidRemindersNotice />);

    expect(getByText(/Reminders are limited or unavailable on Android/i)).toBeTruthy();
  });

  it('exposes accessibilityRole="alert" on the banner container', () => {
    const {
      AndroidRemindersNotice,
    } = require('@/modules/eventkit-lab/components/AndroidRemindersNotice');

    const { getByTestId } = render(<AndroidRemindersNotice />);

    const banner = getByTestId('eventkit-android-reminders-notice');
    expect(banner.props.accessibilityRole).toBe('alert');
  });
});
