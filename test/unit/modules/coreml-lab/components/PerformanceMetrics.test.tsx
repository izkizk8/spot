/**
 * PerformanceMetrics component tests (feature 016).
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PerformanceMetrics } from '@/modules/coreml-lab/components/PerformanceMetrics';

describe('PerformanceMetrics', () => {
  it('renders empty state when metrics are null', () => {
    const { getByText } = render(<PerformanceMetrics inferenceMs={null} computeUnits={[]} />);
    expect(getByText('— ms · —')).toBeTruthy();
  });

  it('renders metrics when provided', () => {
    const { getByText } = render(
      <PerformanceMetrics inferenceMs={75} computeUnits={['cpu', 'gpu']} />,
    );
    expect(getByText('75 ms · CPU+GPU')).toBeTruthy();
  });

  it('formats neural engine correctly', () => {
    const { getByText } = render(
      <PerformanceMetrics inferenceMs={50} computeUnits={['cpu', 'neuralEngine']} />,
    );
    expect(getByText('50 ms · CPU+NeuralEngine')).toBeTruthy();
  });
});
