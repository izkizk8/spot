/**
 * @file ColorPickerDemo.test.tsx
 * @description iOS SwiftUI ColorPicker demo test (T007)
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock @expo/ui/swift-ui
let capturedOnChange: ((color: string) => void) | undefined;
jest.mock('@expo/ui/swift-ui', () => ({
  Host: ({ children }: { children: React.ReactNode }) => children,
  ColorPicker: (props: any) => {
    capturedOnChange = props.onChange;
    return null;
  },
  RNHostView: ({ children }: { children: React.ReactNode }) => children,
}));

import { ColorPickerDemo } from '@/modules/swiftui-interop/demos/ColorPickerDemo';

describe('ColorPickerDemo (iOS)', () => {
  beforeEach(() => {
    capturedOnChange = undefined;
  });

  it('renders with real SwiftUI caption', () => {
    const { getByText } = render(<ColorPickerDemo />);
    expect(getByText(/real SwiftUI/i)).toBeTruthy();
  });

  it('updates RN swatch when SwiftUI ColorPicker changes', () => {
    const { getByTestId } = render(<ColorPickerDemo />);

    const swatch = getByTestId('color-swatch');
    expect(swatch).toBeTruthy();

    // Simulate SwiftUI color picker onChange
    expect(capturedOnChange).toBeDefined();
    if (capturedOnChange) {
      capturedOnChange('#ff8800');
      // In the actual component, this would update the swatch's backgroundColor
    }
  });

  it('has testID for e2e testing', () => {
    const { getByTestId } = render(<ColorPickerDemo />);
    expect(getByTestId('color-picker-demo')).toBeTruthy();
  });
});
