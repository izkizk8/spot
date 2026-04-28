/**
 * CoreML Lab screen tests — iOS variant (feature 016).
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock the bridge before importing the screen
jest.mock('@/native/coreml', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => true),
    loadModel: jest.fn(() =>
      Promise.resolve({
        loaded: true,
        modelName: 'MobileNetV2',
        computeUnits: ['cpu', 'gpu'],
      }),
    ),
    classify: jest.fn(() =>
      Promise.resolve({
        predictions: [{ label: 'dog', confidence: 0.95 }],
        inferenceMs: 50,
      }),
    ),
  },
}));

import CoreMLLabScreen from '@/modules/coreml-lab/screen';

describe('CoreMLLabScreen (iOS)', () => {
  it('renders the screen title', () => {
    const { getByText } = render(<CoreMLLabScreen />);
    expect(getByText('CoreML Lab')).toBeTruthy();
  });

  it('renders the sample image grid', () => {
    const { UNSAFE_getAllByType } = render(<CoreMLLabScreen />);
    const { Pressable } = require('react-native');
    const buttons = UNSAFE_getAllByType(Pressable);
    // Should have sample buttons + classify button + source picker buttons
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders the Run Inference button', async () => {
    const { findByText } = render(<CoreMLLabScreen />);
    // Wait for the button to appear after mount effects complete
    const button = await findByText('Run Inference');
    expect(button).toBeTruthy();
  });
});
