/**
 * @file screen.android.test.tsx
 * @description Android SwiftUI Interop screen test (T023)
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Guard: @expo/ui/swift-ui should NEVER be imported on Android
jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on android');
});

// Explicit-filename import
import SwiftUIInteropScreen from '@/modules/swiftui-interop/screen.android';

describe('SwiftUIInteropScreen (Android)', () => {
  it('renders without importing SwiftUI', () => {
    const { getByTestId } = render(<SwiftUIInteropScreen />);
    expect(getByTestId('swiftui-interop-screen')).toBeTruthy();
  });

  it('displays the Android banner with exact text', () => {
    const { getByText } = render(<SwiftUIInteropScreen />);
    expect(getByText("SwiftUI is iOS-only — here's the Material counterpart")).toBeTruthy();
  });

  it('renders all 5 fallback demos', () => {
    const { getByTestId } = render(<SwiftUIInteropScreen />);

    expect(getByTestId('picker-demo')).toBeTruthy();
    expect(getByTestId('color-picker-demo')).toBeTruthy();
    expect(getByTestId('date-picker-demo')).toBeTruthy();
    expect(getByTestId('slider-demo')).toBeTruthy();
    expect(getByTestId('stepper-toggle-demo')).toBeTruthy();
  });
});
