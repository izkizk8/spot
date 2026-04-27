/**
 * @file PickerDemo.web.test.tsx
 * @description Web RN fallback PickerDemo test
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on web');
});

import { PickerDemo } from '@/modules/swiftui-interop/demos/PickerDemo.web';

describe('PickerDemo (Web fallback)', () => {
  it('renders without importing SwiftUI', () => {
    const { getByTestId } = render(<PickerDemo />);
    expect(getByTestId('picker-demo')).toBeTruthy();
  });

  it('updates echo when a chip is pressed', () => {
    const { getByText, getAllByRole } = render(<PickerDemo />);
    const chips = getAllByRole('button');
    expect(chips.length).toBeGreaterThan(0);
    fireEvent.press(chips[1]);
    expect(getByText(/Selected:/)).toBeTruthy();
  });
});
