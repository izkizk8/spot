/**
 * PredictionsChart component tests (feature 016).
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PredictionsChart } from '@/modules/coreml-lab/components/PredictionsChart';

describe('PredictionsChart', () => {
  it('renders empty state when no predictions', () => {
    const { getByText } = render(<PredictionsChart predictions={[]} />);
    expect(getByText(/No predictions yet/i)).toBeTruthy();
  });

  it('renders predictions when provided', () => {
    const predictions = [
      { label: 'dog', confidence: 0.95 },
      { label: 'cat', confidence: 0.85 },
    ];
    const { getByText } = render(<PredictionsChart predictions={predictions} />);
    expect(getByText('dog')).toBeTruthy();
    expect(getByText('cat')).toBeTruthy();
    expect(getByText('95.0%')).toBeTruthy();
    expect(getByText('85.0%')).toBeTruthy();
  });

  it('renders maximum 5 predictions', () => {
    const predictions = [
      { label: 'a', confidence: 0.9 },
      { label: 'b', confidence: 0.8 },
      { label: 'c', confidence: 0.7 },
      { label: 'd', confidence: 0.6 },
      { label: 'e', confidence: 0.5 },
      { label: 'f', confidence: 0.4 },
    ];
    const { queryByText } = render(<PredictionsChart predictions={predictions} />);
    expect(queryByText('a')).toBeTruthy();
    expect(queryByText('e')).toBeTruthy();
    expect(queryByText('f')).toBeNull();
  });
});
