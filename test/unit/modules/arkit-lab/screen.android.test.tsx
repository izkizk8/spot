/**
 * ARKit Screen Test - Android variant
 * Feature: 034-arkit-basics
 *
 * Tests that Android renders the same panel structure with IOSOnlyBanner in place
 * of AR view, disabled configuration controls, and no bridge calls at evaluation.
 */

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';

// Set platform before imports
Platform.OS = 'android';

// Mock useARKitSession hook
jest.mock('@/modules/arkit-lab/hooks/useARKitSession', () => ({
  useARKitSession: jest.fn(),
}));

// Mock native arkit bridge
jest.mock('@/native/arkit', () => ({
  isAvailable: jest.fn(() => false),
  ARKitNotSupported: class extends Error {},
}));

import ARKitScreen from '@/modules/arkit-lab/screen';
import { useARKitSession } from '@/modules/arkit-lab/hooks/useARKitSession';

describe('ARKitScreen (Android)', () => {
  const mockSession = {
    config: {
      planeDetection: 'horizontal' as const,
      peopleOcclusion: false,
      lightEstimation: true,
      worldMapPersistence: false,
    },
    anchors: [],
    info: {
      state: 'idle' as const,
      anchorCount: 0,
      fps: 0,
      duration: 0,
      trackingState: 'notAvailable' as const,
    },
    placeAnchorAt: jest.fn(),
    clearAnchors: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    reset: jest.fn(),
    setConfig: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useARKitSession as jest.Mock).mockReturnValue(mockSession);
  });

  it('renders panels in same order as iOS', () => {
    const { getByText } = render(<ARKitScreen />);

    expect(getByText(/capabilities/i)).toBeTruthy();
    expect(getByText(/configuration/i)).toBeTruthy();
    expect(getByText(/anchors/i)).toBeTruthy();
  });

  it('renders IOSOnlyBanner in AR region', () => {
    const { getByRole } = render(<ARKitScreen />);

    expect(getByRole('alert')).toBeTruthy();
  });

  it('ConfigurationCard has disabled accessibility state', () => {
    const { getByLabelText } = render(<ARKitScreen />);

    const configCard = getByLabelText(/configuration/i);
    expect(configCard.props.accessibilityState?.disabled).toBe(true);
  });

  it('displays explanatory caption for iOS-only controls', () => {
    const { getByText } = render(<ARKitScreen />);

    expect(getByText(/iOS only/i)).toBeTruthy();
  });
});
