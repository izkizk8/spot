/**
 * PreviewButton Component Tests
 * Feature: 062-realitykit-usdz
 */
import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import PreviewButton from '@/modules/062-realitykit-usdz/components/PreviewButton';

describe('PreviewButton', () => {
  it('renders button label when not loading', () => {
    render(<PreviewButton loading={false} onPress={jest.fn()} />);
    expect(screen.getByText(/Open AR Quick Look/i)).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<PreviewButton loading={false} onPress={onPress} />);
    fireEvent.press(screen.getByText(/Open AR Quick Look/i));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows ActivityIndicator when loading', () => {
    render(<PreviewButton loading={true} onPress={jest.fn()} />);
    expect(screen.queryByText(/Open AR Quick Look/i)).toBeNull();
  });
});
