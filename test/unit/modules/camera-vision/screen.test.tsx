/**
 * Camera Vision screen tests — iOS variant (feature 017, User Story 1).
 */

import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';

// Mock expo-camera before import
const mockTakePictureAsync = jest.fn(() =>
  Promise.resolve({
    base64: 'mock-base64-data',
    uri: 'file:///mock.jpg',
    width: 1920,
    height: 1080,
  }),
);

jest.mock('expo-camera', () => {
  const ReactInMock = require('react');
  return {
    CameraView: ReactInMock.forwardRef((props: any, ref: any) => {
      // Attach the mock method to the ref so useFrameAnalyzer can call it
      ReactInMock.useImperativeHandle(ref, () => ({
        takePictureAsync: mockTakePictureAsync,
      }));
      return ReactInMock.createElement('CameraView', props);
    }),
    useCameraPermissions: jest.fn(),
  };
});

// Mock the vision-detector bridge before importing the screen
jest.mock('@/native/vision-detector', () => {
  const mockAnalyze = jest.fn(() =>
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
  );

  const mockBridge = {
    isAvailable: jest.fn(() => true),
    analyze: mockAnalyze,
  };

  return {
    __esModule: true,
    isAvailable: mockBridge.isAvailable,
    analyze: mockBridge.analyze,
    default: mockBridge,
  };
});

// Access the mocked module after jest.mock
import visionBridge from '@/native/vision-detector';
const mockBridge = visionBridge as jest.Mocked<typeof visionBridge>;

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
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

const mockUseCameraPermissions = useCameraPermissions as jest.MockedFunction<
  typeof useCameraPermissions
>;

describe('CameraVisionScreen (iOS)', () => {
  beforeEach(() => {
    // Use real timers for screen tests - they're too complex for fake timers
    jest.useRealTimers();
    jest.clearAllMocks();
    mockTakePictureAsync.mockClear();
    mockBridge.analyze.mockClear();
    // Reset the mock implementations
    mockBridge.analyze.mockResolvedValue({
      observations: [
        {
          kind: 'face',
          boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
        },
      ],
      analysisMs: 50,
      imageWidth: 1920,
      imageHeight: 1080,
    });
  });

  afterEach(() => {
    // No need to clean up timers since we're using real timers
  });

  it('asks for camera permission on mount', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, status: 'undetermined', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    render(<CameraVisionScreen />);
    await act(async () => {});
    expect(requestPermission).toHaveBeenCalled();
  });

  it('renders permission denied message with retry button when permission denied', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, status: 'denied', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    const view = render(<CameraVisionScreen />);
    await act(async () => {});
    const { getByText } = view;
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

    // Wait a bit with real timers
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Bridge analyze should never be called
    expect(mockBridge.analyze).not.toHaveBeenCalled();
  });

  it('renders CameraPreview and ModePicker when permission granted', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    const view = render(<CameraVisionScreen />);
    await act(async () => {});
    const { UNSAFE_getByType, getByText } = view;
    // CameraView is now a component, not a string
    expect(() => UNSAFE_getByType('CameraView' as any)).not.toThrow();
    // ModePicker should be present
    expect(getByText('Faces')).toBeTruthy();
  });

  it('renders StatsBar with fps, lastAnalysisMs, detected', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    const { getByText } = render(<CameraVisionScreen />);

    // Wait for first analysis cycle to complete (250ms interval + promise resolution time)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    // StatsBar should show analysis ms after successful analysis
    expect(getByText('50 ms')).toBeTruthy();
  });

  it('renders error banner on bridge rejection without crashing', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, status: 'granted', canAskAgain: true, expires: 'never' },
      requestPermission,
    ] as any);

    // Mock bridge to reject
    mockBridge.analyze.mockRejectedValueOnce(new Error('Test error'));

    const { queryByText } = render(<CameraVisionScreen />);

    // Wait for first analysis cycle to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    // Should render error banner with the error message
    expect(queryByText(/Test error/)).toBeTruthy();
  });
});
