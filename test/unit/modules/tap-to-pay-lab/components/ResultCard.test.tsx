/**
 * ResultCard Test
 * Feature: 051-tap-to-pay
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import ResultCard from '@/modules/tap-to-pay-lab/components/ResultCard';

describe('ResultCard', () => {
  it('renders no attempts when result is null', () => {
    render(<ResultCard result={null} />);
    expect(screen.getByText(/No payment attempts yet/i)).toBeTruthy();
  });

  it('renders success details', () => {
    render(
      <ResultCard
        result={{ outcome: 'success', transactionId: 'tx-123', amount: 1000, currency: 'USD' }}
      />,
    );
    expect(screen.getByText(/success/i)).toBeTruthy();
    expect(screen.getByText(/tx-123/i)).toBeTruthy();
  });

  it('renders declined reason', () => {
    render(<ResultCard result={{ outcome: 'declined', declinedReason: 'Insufficient funds' }} />);
    expect(screen.getByText(/declined/i)).toBeTruthy();
    expect(screen.getByText(/Insufficient funds/i)).toBeTruthy();
  });

  it('renders error message', () => {
    render(<ResultCard result={{ outcome: 'error', errorMessage: 'Network error' }} />);
    expect(screen.getByText(/Network error/i)).toBeTruthy();
  });
});
