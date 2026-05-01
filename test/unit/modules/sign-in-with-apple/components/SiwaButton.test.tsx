/**
 * Test suite for SiwaButton component.
 */

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';

import SiwaButton from '@/modules/sign-in-with-apple/components/SiwaButton';

jest.mock('expo-apple-authentication');

describe('SiwaButton', () => {
  const defaultProps = {
    variant: 'default' as const,
    style: 'black' as const,
    corner: 'round' as const,
    onPress: jest.fn(),
    onVariantChange: jest.fn(),
    onStyleChange: jest.fn(),
    onCornerChange: jest.fn(),
  };

  it('renders fallback button on non-iOS', () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });

    const { getByTestId } = render(<SiwaButton {...defaultProps} />);
    expect(getByTestId('siwa-button-fallback')).toBeTruthy();

    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });

  it('renders fallback button when disabled', () => {
    const { getByTestId } = render(<SiwaButton {...defaultProps} disabled />);
    expect(getByTestId('siwa-button-fallback')).toBeTruthy();
  });

  it('renders pickers', () => {
    const { getByText } = render(<SiwaButton {...defaultProps} />);
    expect(getByText('Variant:')).toBeTruthy();
    expect(getByText('Style:')).toBeTruthy();
    expect(getByText('Corner:')).toBeTruthy();
  });
});
