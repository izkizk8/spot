/**
 * Camera Vision screen tests — iOS variant (feature 017, User Story 1).
 */

import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';

// Mock expo-camera before import
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(),
}));

// Mock the vision-detector bridge before importing the screen
jest.mock('@/native/vision-detector', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => true),
    analyze: jest.fn(() =>
      Promise.resolve({
        observations: [
          {
            kind: 'face',
            boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          },
        ],
        analysisMs: 50,
        imageWidth: 1920,
        imageHeight: 1080,
      }),
    ),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const RN = require('react-native');
  
  return {
    default: {
      View: RN.View,
      createAnimatedComponent: (component: any) => component,
    },
    useSharedValue: (initial: any) => ({ value: initial }),
    useAnimatedStyle: (fn: any) => fn(),
    withTiming: (value: any) => value,
  };
});

// Mock useReducedMotion
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

import CameraVisionScreen from '@/modules/camera-vision/screen';
import { useCameraPermissions } from 'expo-camera';
import visionBridge from '@/native/vision-detector';

const mockUseCameraPermissions = useCameraPermissions as jest.MockedFunction<
  typeof useCameraPermissions
>;

describe('CameraVisionScreen (iOS)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('asks for camera permission on mount', () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, status: 'undetermined', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    render(<CameraVisionScreen />);
    expect(requestPermission).toHaveBeenCalled();
  });

  it('renders permission denied message with retry button when permission denied', () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, status: 'denied', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    const { getByText } = render(<CameraVisionScreen />);
    expect(getByText(/camera permission/i)).toBeTruthy();
    
    const retryButton = getByText(/retry/i);
    expect(retryButton).toBeTruthy();
    
    fireEvent.press(retryButton);
    expect(requestPermission).toHaveBeenCalled();
  });

  it('never starts the analysis loop when permission denied', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, status: 'denied', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    render(<CameraVisionScreen />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Bridge analyze should never be called
    expect(visionBridge.analyze).not.toHaveBeenCalled();
  });

  it('renders CameraPreview when permission granted', () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    const { UNSAFE_getByType } = render(<CameraVisionScreen />);
    expect(UNSAFE_getByType('CameraView')).toBeTruthy();
  });

  it('renders ModePicker preselected to Faces', () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    const { getByText } = render(<CameraVisionScreen />);
    expect(getByText('Faces')).toBeTruthy();
  });

  it('renders StatsBar with fps, lastAnalysisMs, detected', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    const { getByText } = render(<CameraVisionScreen />);

    // Wait for first analysis cycle
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // StatsBar should show some data (exact format depends on implementation)
    expect(getByText(/ms/)).toBeTruthy();
  });

  it('populates OverlayCanvas with observations from bridge', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    const { queryAllByTestId } = render(<CameraVisionScreen />);

    // Wait for first analysis cycle
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Should have at least one overlay from the mocked bridge result
    const overlays = queryAllByTestId(/^overlay-/);
    expect(overlays.length).toBeGreaterThan(0);
  });

  it('renders error banner on bridge rejection without crashing', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    // Mock bridge to reject
    (visionBridge.analyze as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    const { queryByText } = render(<CameraVisionScreen />);

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Should render some error indication
    // The exact text depends on implementation, but no crash should occur
    expect(queryByText(/error/i)).toBeTruthy();
  });
});
