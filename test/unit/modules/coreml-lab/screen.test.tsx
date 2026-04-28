/**
 * CoreML Lab screen tests — iOS variant (feature 016).
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

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
  it('renders the screen title', async () => {
    const result = render(<CoreMLLabScreen />);
    expect(result.getByText('CoreML Lab')).toBeTruthy();
    // Flush the async loadModel effect so React doesn't warn about act()
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('renders the four sample thumbnails', async () => {
    const { getAllByTestId } = render(<CoreMLLabScreen />);
    const thumbs = getAllByTestId(/^sample-/);
    expect(thumbs.length).toBe(4);
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('renders the Run Inference button', async () => {
    const { findByText } = render(<CoreMLLabScreen />);
    const button = await findByText('Run Inference');
    expect(button).toBeTruthy();
  });
});
