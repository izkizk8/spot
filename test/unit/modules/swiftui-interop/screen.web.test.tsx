/**
 * @file screen.web.test.tsx
 * @description Web SwiftUI Interop screen test (T035)
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Guard: @expo/ui/swift-ui should NEVER be imported on Web
jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on web');
});

// Explicit-filename import
import SwiftUIInteropScreen from '@/modules/swiftui-interop/screen.web';

describe('SwiftUIInteropScreen (Web)', () => {
  it('renders without importing SwiftUI', () => {
    const { getByTestId } = render(<SwiftUIInteropScreen />);
    expect(getByTestId('swiftui-interop-screen')).toBeTruthy();
  });

  it('displays the Web banner with exact text', () => {
    const { getByText } = render(<SwiftUIInteropScreen />);
    expect(getByText('Native SwiftUI is iOS-only')).toBeTruthy();
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
