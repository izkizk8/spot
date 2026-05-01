/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import ResultCard from '@/modules/apple-pay-lab/components/ResultCard';
import type { PaymentResult } from '@/native/applepay.types';

describe('ResultCard', () => {
  it('renders the empty state when no result is present', () => {
    const { getByTestId } = render(<ResultCard result={null} errorMessage={null} />);
    expect(getByTestId('apple-pay-result-empty')).toBeTruthy();
  });

  it('renders a success result with a token', () => {
    const result: PaymentResult = {
      status: 'success',
      token: {
        transactionIdentifier: 'tx-42',
        paymentNetwork: 'Visa',
        paymentDataBase64: 'BLOB',
      },
      errorMessage: null,
    };
    const { getByTestId } = render(<ResultCard result={result} errorMessage={null} />);
    expect(getByTestId('apple-pay-result-status').props.children).toBe('✅ success');
    expect(getByTestId('apple-pay-result-transaction-id').props.children).toBe('tx-42');
    expect(getByTestId('apple-pay-result-network').props.children).toBe('Visa');
    expect(getByTestId('apple-pay-result-payment-data').props.children).toBe('BLOB');
  });

  it('renders a failure result with an error message', () => {
    const result: PaymentResult = {
      status: 'failure',
      token: null,
      errorMessage: 'Card declined.',
    };
    const { getByTestId, queryByTestId } = render(
      <ResultCard result={result} errorMessage={null} />,
    );
    expect(getByTestId('apple-pay-result-error').props.children).toBe('Card declined.');
    expect(queryByTestId('apple-pay-result-transaction-id')).toBeNull();
  });

  it('renders the cancelled status', () => {
    const result: PaymentResult = {
      status: 'cancelled',
      token: null,
      errorMessage: null,
    };
    const { getByTestId } = render(<ResultCard result={result} errorMessage={null} />);
    expect(getByTestId('apple-pay-result-status').props.children).toBe('⚪ cancelled');
  });

  it('renders an extra error message when no result error overlaps', () => {
    const { getByTestId } = render(<ResultCard result={null} errorMessage='Validation failed' />);
    expect(getByTestId('apple-pay-result-extra-error').props.children).toBe('Validation failed');
  });
});
