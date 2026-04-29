/**
 * ExplainerCard tests.
 * Feature: 039-quick-actions
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { ExplainerCard } from '@/modules/quick-actions-lab/components/ExplainerCard';

describe('ExplainerCard', () => {
  it('renders the 4-action cap explanation', () => {
    const { getByTestId, getByText } = render(<ExplainerCard />);
    expect(getByTestId('explainer-card')).toBeTruthy();
    expect(getByText(/up to 4 rows/i)).toBeTruthy();
  });
});
