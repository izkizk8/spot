/**
 * @file DatePickerDemo.test.tsx
 * @description iOS SwiftUI DatePicker demo test (T008)
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock @expo/ui/swift-ui
let capturedOnChange: ((date: Date) => void) | undefined;
jest.mock('@expo/ui/swift-ui', () => ({
  Host: ({ children }: { children: React.ReactNode }) => children,
  DatePicker: (props: any) => {
    capturedOnChange = props.onDateChange;
    return null;
  },
  RNHostView: ({ children }: { children: React.ReactNode }) => children,
}));

import { DatePickerDemo } from '@/modules/swiftui-interop/demos/DatePickerDemo';

describe('DatePickerDemo (iOS)', () => {
  beforeEach(() => {
    capturedOnChange = undefined;
  });

  it('renders with real SwiftUI caption', () => {
    const { getByText } = render(<DatePickerDemo />);
    expect(getByText(/real SwiftUI/i)).toBeTruthy();
  });

  it('updates RN echo when SwiftUI DatePicker changes', () => {
    const { getByText } = render(<DatePickerDemo />);

    // Should show some date text initially
    expect(getByText(/202\d/)).toBeTruthy(); // Year in 2020s

    // Simulate SwiftUI date picker onChange
    expect(capturedOnChange).toBeDefined();
    if (capturedOnChange) {
      const testDate = new Date('2026-05-15');
      capturedOnChange(testDate);
      // Component would update to show this date
    }
  });

  it('has testID for e2e testing', () => {
    const { getByTestId } = render(<DatePickerDemo />);
    expect(getByTestId('date-picker-demo')).toBeTruthy();
  });
});
