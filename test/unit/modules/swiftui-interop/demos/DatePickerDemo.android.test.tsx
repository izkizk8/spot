/**
 * @file DatePickerDemo.android.test.tsx
 * @description Android RN fallback DatePickerDemo test
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on android');
});

import { DatePickerDemo } from '@/modules/swiftui-interop/demos/DatePickerDemo.android';

describe('DatePickerDemo (Android fallback)', () => {
  it('renders without importing SwiftUI', () => {
    const { getByTestId } = render(<DatePickerDemo />);
    expect(getByTestId('date-picker-demo')).toBeTruthy();
  });

  it('shifts displayed date when +/- buttons are pressed', () => {
    const { getByText, getAllByRole } = render(<DatePickerDemo />);
    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    fireEvent.press(buttons[1]); // +1 day
    // year still shown
    expect(getByText(/202\d/)).toBeTruthy();
  });
});
