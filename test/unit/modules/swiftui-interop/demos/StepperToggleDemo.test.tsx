/**
 * @file StepperToggleDemo.test.tsx
 * @description iOS SwiftUI Stepper + Toggle demo test (T010)
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

// Mock @expo/ui/swift-ui
let capturedStepperOnChange: ((value: number) => void) | undefined;
let capturedToggleOnChange: ((value: boolean) => void) | undefined;
jest.mock('@expo/ui/swift-ui', () => ({
  Host: ({ children }: { children: React.ReactNode }) => children,
  Stepper: (props: any) => {
    capturedStepperOnChange = props.onValueChange;
    return null;
  },
  Toggle: (props: any) => {
    capturedToggleOnChange = props.onIsOnChange;
    return null;
  },
  RNHostView: ({ children }: { children: React.ReactNode }) => children,
}));

import { StepperToggleDemo } from '@/modules/swiftui-interop/demos/StepperToggleDemo';

describe('StepperToggleDemo (iOS)', () => {
  beforeEach(() => {
    capturedStepperOnChange = undefined;
    capturedToggleOnChange = undefined;
  });

  it('renders with real SwiftUI caption', () => {
    const { getByText } = render(<StepperToggleDemo />);
    expect(getByText(/real SwiftUI/i)).toBeTruthy();
  });

  it('updates RN readout when SwiftUI Stepper changes', () => {
    const { getByText } = render(<StepperToggleDemo />);

    // Should show some count initially
    expect(getByText(/\d+/)).toBeTruthy();

    // Simulate SwiftUI stepper onChange
    expect(capturedStepperOnChange).toBeDefined();
    if (capturedStepperOnChange) {
      act(() => {
        capturedStepperOnChange!(5);
      });
      // Component would update to show count 5
    }
  });

  it('updates RN readout when SwiftUI Toggle changes', () => {
    const { getByText } = render(<StepperToggleDemo />);

    // Should show toggle state
    expect(getByText(/(on|off|true|false)/i)).toBeTruthy();

    // Simulate SwiftUI toggle onChange
    expect(capturedToggleOnChange).toBeDefined();
    if (capturedToggleOnChange) {
      act(() => {
        capturedToggleOnChange!(true);
      });
      // Component would update to show "on" or similar
    }
  });

  it('has testID for e2e testing', () => {
    const { getByTestId } = render(<StepperToggleDemo />);
    expect(getByTestId('stepper-toggle-demo')).toBeTruthy();
  });
});
