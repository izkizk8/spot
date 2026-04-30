/**
 * Visual Look Up Lab Screen Test (iOS)
 * Feature: 060-visual-look-up
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 15;

import type {
  VisualLookUpState,
  VisualLookUpActions,
} from '@/modules/visual-look-up-lab/hooks/useVisualLookUp';

type StoreShape = VisualLookUpState & VisualLookUpActions;

const baseStore: StoreShape = {
  supported: true as boolean | null,
  result: null,
  loading: false,
  lastError: null,
  checkSupport: jest.fn(async () => {}),
  analyzeImage: jest.fn(async (_imageUri: string) => {}),
  clearResult: jest.fn(),
};

const mockUseVisualLookUp = jest.fn(() => baseStore);

jest.mock('@/modules/visual-look-up-lab/hooks/useVisualLookUp', () => ({
  useVisualLookUp: mockUseVisualLookUp,
}));

describe('VisualLookUpLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/visual-look-up-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/Visual Look Up Capability/i)).toBeTruthy();
    expect(screen.getByText(/Detected Subjects/i)).toBeTruthy();
    expect(screen.getByText(/Analyse Demo/i)).toBeTruthy();
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('calls analyzeImage when Analyse Demo is pressed', () => {
    const Screen = require('@/modules/visual-look-up-lab/screen').default;
    render(<Screen />);
    fireEvent.press(screen.getByText(/Analyse Demo/i));
    expect(baseStore.analyzeImage).toHaveBeenCalledTimes(1);
  });

  it('shows Clear button when result is present', () => {
    mockUseVisualLookUp.mockReturnValueOnce({
      ...baseStore,
      result: {
        supported: true,
        imageUri: 'asset://demo.jpg',
        subjects: [],
        hasSaliencyMap: false,
        analyzedAt: 1,
      },
    });
    const Screen = require('@/modules/visual-look-up-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/^Clear$/)).toBeTruthy();
  });

  it('shows error message when lastError is set', () => {
    mockUseVisualLookUp.mockReturnValueOnce({
      ...baseStore,
      lastError: new Error('bridge-error'),
    });
    const Screen = require('@/modules/visual-look-up-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/bridge-error/)).toBeTruthy();
  });
});
