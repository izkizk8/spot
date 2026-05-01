/**
 * @file StepperToggleDemo.android.test.tsx
 * @description Android RN fallback StepperToggleDemo test
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on android');
});

import { StepperToggleDemo } from '@/modules/swiftui-interop/demos/StepperToggleDemo.android';

describe('StepperToggleDemo (Android fallback)', () => {
  it('renders without importing SwiftUI', () => {
    const { getByTestId } = render(<StepperToggleDemo />);
    expect(getByTestId('stepper-toggle-demo')).toBeTruthy();
  });

  it('increments count when + is pressed', () => {
    const { getByText, getAllByRole } = render(<StepperToggleDemo />);
    const buttons = getAllByRole('button');
    fireEvent.press(buttons[1]); // +
    expect(getByText(/Count: 1/)).toBeTruthy();
  });

  it('does not go below zero', () => {
    const { getByText, getAllByRole } = render(<StepperToggleDemo />);
    const buttons = getAllByRole('button');
    fireEvent.press(buttons[0]); // -
    expect(getByText(/Count: 0/)).toBeTruthy();
  });
});
