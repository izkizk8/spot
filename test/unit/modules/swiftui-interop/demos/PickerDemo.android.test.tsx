/**
 * @file PickerDemo.android.test.tsx
 * @description Android RN fallback PickerDemo test (T018)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Guard: @expo/ui/swift-ui should NEVER be imported on Android
jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on android');
});

// Explicit-filename import to bypass platform resolution
import { PickerDemo } from '@/modules/swiftui-interop/demos/PickerDemo.android';

describe('PickerDemo (Android fallback)', () => {
  it('renders without importing SwiftUI', () => {
    const { getByTestId } = render(<PickerDemo />);
    expect(getByTestId('picker-demo')).toBeTruthy();
  });

  it('has interactive RN fallback control', () => {
    const { getByText, getAllByRole } = render(<PickerDemo />);

    // Should have chip-based or picker-based fallback
    // Fire interaction and verify echo updates
    const chips = getAllByRole('button');
    expect(chips.length).toBeGreaterThan(0);

    // Tap a chip
    fireEvent.press(chips[1]);

    // Echo should update
    expect(getByText(/Selected:/)).toBeTruthy();
  });
});
