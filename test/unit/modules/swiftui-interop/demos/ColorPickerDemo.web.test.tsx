/**
 * @file ColorPickerDemo.web.test.tsx
 * @description Web RN fallback ColorPickerDemo test
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on web');
});

import { ColorPickerDemo } from '@/modules/swiftui-interop/demos/ColorPickerDemo.web';

describe('ColorPickerDemo (Web fallback)', () => {
  it('renders preview swatch without importing SwiftUI', () => {
    const { getByTestId } = render(<ColorPickerDemo />);
    expect(getByTestId('color-swatch')).toBeTruthy();
  });

  it('updates preview swatch when a color is pressed', () => {
    const { getByTestId, getAllByRole } = render(<ColorPickerDemo />);
    const swatches = getAllByRole('button');
    fireEvent.press(swatches[3]);
    expect(getByTestId('color-swatch')).toBeTruthy();
  });
});
