/**
 * AcceptPaymentButton Test
 * Feature: 051-tap-to-pay
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import AcceptPaymentButton from '@/modules/tap-to-pay-lab/components/AcceptPaymentButton';

describe('AcceptPaymentButton', () => {
  it('renders button', () => {
    const onPress = jest.fn();
    render(<AcceptPaymentButton onPress={onPress} loading={false} disabled={false} />);
    expect(screen.getByText(/Accept Payment/i)).toBeTruthy();
  });

  it('disabled when loading', () => {
    const onPress = jest.fn();
    render(<AcceptPaymentButton onPress={onPress} loading={true} disabled={false} />);
    expect(screen.getByText(/Processing/i)).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AcceptPaymentButton onPress={onPress} loading={false} disabled={false} />,
    );
    fireEvent.press(getByText(/Accept Payment/i));
    expect(onPress).toHaveBeenCalled();
  });
});
