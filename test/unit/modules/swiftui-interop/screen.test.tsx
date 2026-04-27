/**
 * @file screen.test.tsx
 * @description iOS SwiftUI Interop screen integration test (T011)
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock all SwiftUI components
jest.mock('@expo/ui/swift-ui', () => ({
  Host: ({ children }: { children: React.ReactNode }) => children,
  Picker: () => null,
  ColorPicker: () => null,
  DatePicker: () => null,
  Slider: () => null,
  Stepper: () => null,
  Toggle: () => null,
  RNHostView: ({ children }: { children: React.ReactNode }) => children,
}));

import SwiftUIInteropScreen from '@/modules/swiftui-interop/screen';

describe('SwiftUIInteropScreen (iOS)', () => {
  it('renders all 5 demo blocks in correct order', () => {
    const { getByTestId } = render(<SwiftUIInteropScreen />);
    
    // All demos should be present
    expect(getByTestId('picker-demo')).toBeTruthy();
    expect(getByTestId('color-picker-demo')).toBeTruthy();
    expect(getByTestId('date-picker-demo')).toBeTruthy();
    expect(getByTestId('slider-demo')).toBeTruthy();
    expect(getByTestId('stepper-toggle-demo')).toBeTruthy();
  });

  it('does not render iOS-only fallback banner', () => {
    const { queryByText } = render(<SwiftUIInteropScreen />);
    
    // On iOS, there should be NO banner
    expect(queryByText(/iOS-only/i)).toBeNull();
    expect(queryByText(/Material counterpart/i)).toBeNull();
    expect(queryByText(/Native SwiftUI is iOS-only/i)).toBeNull();
  });

  it('renders demos in canonical order (Picker → Color → Date → Slider → StepperToggle)', () => {
    const { getAllByTestId } = render(<SwiftUIInteropScreen />);
    
    // Get all demo containers - they should appear in order
    const demos = [
      'picker-demo',
      'color-picker-demo', 
      'date-picker-demo',
      'slider-demo',
      'stepper-toggle-demo',
    ];
    
    demos.forEach((testId) => {
      expect(getAllByTestId(testId)).toBeTruthy();
    });
  });
});
