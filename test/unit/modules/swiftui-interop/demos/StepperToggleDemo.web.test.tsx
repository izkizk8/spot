/**
 * @file StepperToggleDemo.web.test.tsx
 * @description Web RN fallback StepperToggleDemo test
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on web');
});

import { StepperToggleDemo } from '@/modules/swiftui-interop/demos/StepperToggleDemo.web';

describe('StepperToggleDemo (Web fallback)', () => {
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
});
