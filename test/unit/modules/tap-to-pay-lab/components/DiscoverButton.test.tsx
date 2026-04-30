/**
 * DiscoverButton Test
 * Feature: 051-tap-to-pay
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import DiscoverButton from '@/modules/tap-to-pay-lab/components/DiscoverButton';

describe('DiscoverButton', () => {
  it('renders button with correct label', () => {
    const onPress = jest.fn();
    render(<DiscoverButton status="idle" onPress={onPress} />);
    expect(screen.getByText(/Discover Reader/i)).toBeTruthy();
  });

  it('disabled during discovering', () => {
    const onPress = jest.fn();
    render(<DiscoverButton status="discovering" onPress={onPress} />);
    const elements = screen.getAllByText(/Discovering/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<DiscoverButton status="idle" onPress={onPress} />);
    fireEvent.press(getByText(/Discover Reader/i));
    expect(onPress).toHaveBeenCalled();
  });
});
