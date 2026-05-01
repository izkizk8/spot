/**
 * @file DatePickerDemo.web.test.tsx
 * @description Web RN fallback DatePickerDemo test
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on web');
});

import { DatePickerDemo } from '@/modules/swiftui-interop/demos/DatePickerDemo.web';

describe('DatePickerDemo (Web fallback)', () => {
  it('renders without importing SwiftUI', () => {
    const { getByTestId } = render(<DatePickerDemo />);
    expect(getByTestId('date-picker-demo')).toBeTruthy();
  });

  it('shifts displayed date when buttons are pressed', () => {
    const { getByText, getAllByRole } = render(<DatePickerDemo />);
    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    fireEvent.press(buttons[0]); // -1 day
    expect(getByText(/202\d/)).toBeTruthy();
  });
});
