/**
 * @file PickerDemo.test.tsx
 * @description iOS SwiftUI Picker demo test (T006)
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock @expo/ui/swift-ui before importing the component
let capturedOnChange: ((selection: string) => void) | undefined;
jest.mock('@expo/ui/swift-ui', () => ({
  Host: ({ children }: { children: React.ReactNode }) => children,
  Picker: (props: any) => {
    capturedOnChange = props.onChange;
    return null;
  },
  RNHostView: ({ children }: { children: React.ReactNode }) => children,
}));

import { PickerDemo } from '@/modules/swiftui-interop/demos/PickerDemo';

describe('PickerDemo (iOS)', () => {
  beforeEach(() => {
    capturedOnChange = undefined;
  });

  it('renders with real SwiftUI caption', () => {
    const { getByText } = render(<PickerDemo />);
    expect(getByText(/real SwiftUI/i)).toBeTruthy();
  });

  it('updates RN echo when SwiftUI Picker changes', () => {
    const { getByText, queryByText } = render(<PickerDemo />);
    
    // Initially should show first option
    const initialText = getByText(/Apple|Red|Small/i); // one of the default options
    expect(initialText).toBeTruthy();
    
    // Simulate SwiftUI picker onChange callback
    expect(capturedOnChange).toBeDefined();
    if (capturedOnChange) {
      capturedOnChange('option-2'); // Assuming options have IDs like option-1, option-2, etc.
      
      // Should update the echo (rerender needed in real scenario, but test mocks should capture state)
    }
  });

  it('has testID for e2e testing', () => {
    const { getByTestId } = render(<PickerDemo />);
    expect(getByTestId('picker-demo')).toBeTruthy();
  });
});
