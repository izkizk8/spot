/**
 * PaymentComposer Test
 * Feature: 051-tap-to-pay
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import PaymentComposer from '@/modules/tap-to-pay-lab/components/PaymentComposer';

describe('PaymentComposer', () => {
  it('renders amount input', () => {
    const onPaymentReady = jest.fn();
    render(<PaymentComposer onPaymentReady={onPaymentReady} />);
    expect(screen.getByPlaceholderText('1234')).toBeTruthy();
  });

  it('renders currency picker', () => {
    const onPaymentReady = jest.fn();
    render(<PaymentComposer onPaymentReady={onPaymentReady} />);
    expect(screen.getByText('USD')).toBeTruthy();
    expect(screen.getByText('EUR')).toBeTruthy();
  });

  it('compose button exists', () => {
    const onPaymentReady = jest.fn();
    render(<PaymentComposer onPaymentReady={onPaymentReady} />);
    expect(screen.getByText(/Compose Payment/i)).toBeTruthy();
  });
});
