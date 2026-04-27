/**
 * @file SliderDemo.web.test.tsx
 * @description Web RN fallback SliderDemo test
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/ui/swift-ui', () => {
  throw new Error('should not be imported on web');
});

import { SliderDemo } from '@/modules/swiftui-interop/demos/SliderDemo.web';

describe('SliderDemo (Web fallback)', () => {
  it('renders bar without importing SwiftUI', () => {
    const { getByTestId } = render(<SliderDemo />);
    expect(getByTestId('slider-bar')).toBeTruthy();
  });

  it('updates value label when a step chip is pressed', () => {
    const { getByText, getAllByRole } = render(<SliderDemo />);
    const chips = getAllByRole('button');
    fireEvent.press(chips[2]); // 50
    expect(getByText('50%')).toBeTruthy();
  });
});
