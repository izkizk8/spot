/**
 * CoreML Lab screen tests — Android variant (feature 016).
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import CoreMLLabScreen from '@/modules/coreml-lab/screen.android';

describe('CoreMLLabScreen (Android)', () => {
  it('renders the screen title', () => {
    const { getByText } = render(<CoreMLLabScreen />);
    expect(getByText('CoreML Lab')).toBeTruthy();
  });

  it('renders iOS-only banner', () => {
    const { getByText } = render(<CoreMLLabScreen />);
    expect(getByText(/CoreML is iOS-only/i)).toBeTruthy();
  });

  it('renders disabled inference button', () => {
    const { getByText } = render(<CoreMLLabScreen />);
    const button = getByText('Run Inference (iOS only)');
    expect(button).toBeTruthy();
  });

  it('renders educational scaffold components', () => {
    const { getByText } = render(<CoreMLLabScreen />);
    expect(getByText('Model')).toBeTruthy(); // ModelPicker
    expect(getByText(/No predictions yet/i)).toBeTruthy(); // PredictionsChart
  });
});
