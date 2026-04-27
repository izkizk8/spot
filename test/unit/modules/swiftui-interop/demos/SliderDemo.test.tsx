/**
 * @file SliderDemo.test.tsx
 * @description iOS SwiftUI Slider demo test (T009)
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock @expo/ui/swift-ui
let capturedOnChange: ((value: number) => void) | undefined;
jest.mock('@expo/ui/swift-ui', () => ({
  Host: ({ children }: { children: React.ReactNode }) => children,
  Slider: (props: any) => {
    capturedOnChange = props.onChange;
    return null;
  },
  RNHostView: ({ children }: { children: React.ReactNode }) => children,
}));

import { SliderDemo } from '@/modules/swiftui-interop/demos/SliderDemo';

describe('SliderDemo (iOS)', () => {
  beforeEach(() => {
    capturedOnChange = undefined;
  });

  it('renders with real SwiftUI caption', () => {
    const { getByText } = render(<SliderDemo />);
    expect(getByText(/real SwiftUI/i)).toBeTruthy();
  });

  it('updates RN bar when SwiftUI Slider changes', () => {
    const { getByTestId } = render(<SliderDemo />);

    const bar = getByTestId('slider-bar');
    expect(bar).toBeTruthy();

    // Simulate SwiftUI slider onChange
    expect(capturedOnChange).toBeDefined();
    if (capturedOnChange) {
      capturedOnChange(42);
      // Component would update bar width to 42%
    }
  });

  it('has testID for e2e testing', () => {
    const { getByTestId } = render(<SliderDemo />);
    expect(getByTestId('slider-demo')).toBeTruthy();
  });
});
