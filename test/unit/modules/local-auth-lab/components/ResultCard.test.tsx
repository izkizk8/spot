/**
 * Test suite for ResultCard component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import ResultCard from '@/modules/local-auth-lab/components/ResultCard';

describe('ResultCard', () => {
  it('renders the placeholder when result is null', () => {
    const { getByText } = render(<ResultCard result={null} />);
    expect(getByText(/No result yet/)).toBeTruthy();
  });

  it('renders success with timestamp', () => {
    const { getByTestId } = render(
      <ResultCard result={{ success: true, timestamp: '2026-01-01T00:00:00.000Z' }} />,
    );
    expect(getByTestId('localauth-result-status')).toHaveTextContent(/Success/);
    expect(getByTestId('localauth-result-timestamp')).toHaveTextContent('2026-01-01T00:00:00.000Z');
  });

  it('renders cancellation as informational', () => {
    const { getByTestId } = render(
      <ResultCard
        result={{ success: false, error: 'user_cancel', timestamp: '2026-01-01T00:00:00.000Z' }}
      />,
    );
    expect(getByTestId('localauth-result-status')).toHaveTextContent(/Cancelled/);
  });

  it('renders generic error type with warning prefix', () => {
    const { getByTestId, getByText } = render(
      <ResultCard
        result={{
          success: false,
          error: 'lockout',
          warning: 'Too many attempts',
          timestamp: '2026-01-01T00:00:00.000Z',
        }}
      />,
    );
    expect(getByTestId('localauth-result-status')).toHaveTextContent(/lockout/);
    expect(getByText(/Warning: Too many attempts/)).toBeTruthy();
  });
});
