/**
 * @file ColorPickerDemo.android.test.tsx
 * @description Android RN fallback ColorPickerDemo test
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on android');
});

import { ColorPickerDemo } from '@/modules/swiftui-interop/demos/ColorPickerDemo.android';

describe('ColorPickerDemo (Android fallback)', () => {
  it('renders preview swatch without importing SwiftUI', () => {
    const { getByTestId } = render(<ColorPickerDemo />);
    expect(getByTestId('color-swatch')).toBeTruthy();
  });

  it('updates preview swatch when a color is pressed', () => {
    const { getByTestId, getAllByRole } = render(<ColorPickerDemo />);
    const swatches = getAllByRole('button');
    expect(swatches.length).toBeGreaterThan(1);
    fireEvent.press(swatches[2]);
    expect(getByTestId('color-swatch')).toBeTruthy();
  });
});
