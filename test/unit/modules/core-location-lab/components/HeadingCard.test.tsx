/**
 * Tests for HeadingCard component (feature 025)
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { HeadingCard } from '@/modules/core-location-lab/components/HeadingCard';
import { useHeading } from '@/modules/core-location-lab/hooks/useHeading';

// Mock useHeading hook
jest.mock('@/modules/core-location-lab/hooks/useHeading');
const mockUseHeading = useHeading as jest.MockedFunction<typeof useHeading>;

// Mock CompassNeedle from sensors-playground
jest.mock('@/modules/sensors-playground/components/CompassNeedle', () => ({
  CompassNeedle: ({ heading }: { heading: number }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="compass-needle">
        <Text>{heading}</Text>
      </View>
    );
  },
}));

describe('HeadingCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHeading.mockReturnValue({
      running: true,
      start: jest.fn(),
      stop: jest.fn(),
      latest: {
        magHeading: 45,
        trueHeading: 43,
        accuracy: 2,
      },
      samplesPerMinute: 10,
      error: null,
      isCalibrated: true,
    });
  });

  it('renders CompassNeedle with headingMagneticNorth wired from hook', () => {
    render(<HeadingCard />);

    const needle = screen.getByTestId('compass-needle');
    expect(needle).toBeTruthy();
    // The compass needle receives the magHeading value
    expect(screen.getByText('45')).toBeTruthy();
  });

  it('shows calibration banner when isCalibrated is false', () => {
    mockUseHeading.mockReturnValue({
      running: true,
      start: jest.fn(),
      stop: jest.fn(),
      latest: {
        magHeading: 90,
        trueHeading: 88,
        accuracy: 0,
      },
      samplesPerMinute: 5,
      error: null,
      isCalibrated: false,
    });

    render(<HeadingCard />);

    // Use getAllByText to handle multiple matches
    expect(screen.getAllByText(/calibrat/i).length).toBeGreaterThanOrEqual(1);
  });

  it('hides calibration banner when isCalibrated is true', () => {
    mockUseHeading.mockReturnValue({
      running: true,
      start: jest.fn(),
      stop: jest.fn(),
      latest: {
        magHeading: 180,
        trueHeading: 178,
        accuracy: 2,
      },
      samplesPerMinute: 10,
      error: null,
      isCalibrated: true,
    });

    render(<HeadingCard />);

    expect(screen.queryByText(/calibrat/i)).toBeNull();
  });

  it('renders "Heading not available" when error is present', () => {
    mockUseHeading.mockReturnValue({
      running: false,
      start: jest.fn(),
      stop: jest.fn(),
      latest: null,
      samplesPerMinute: 0,
      error: new Error('Heading service unavailable'),
      isCalibrated: true,
    });

    render(<HeadingCard />);

    expect(screen.getByText(/heading not available/i)).toBeTruthy();
  });

  it('does not render CompassNeedle when error is present', () => {
    mockUseHeading.mockReturnValue({
      running: false,
      start: jest.fn(),
      stop: jest.fn(),
      latest: null,
      samplesPerMinute: 0,
      error: new Error('Heading service unavailable'),
      isCalibrated: true,
    });

    render(<HeadingCard />);

    expect(screen.queryByTestId('compass-needle')).toBeNull();
  });

  it('renders heading value display', () => {
    mockUseHeading.mockReturnValue({
      running: true,
      start: jest.fn(),
      stop: jest.fn(),
      latest: {
        magHeading: 270,
        trueHeading: 268,
        accuracy: 3,
      },
      samplesPerMinute: 12,
      error: null,
      isCalibrated: true,
    });

    render(<HeadingCard />);

    // Should display the heading degrees - use getAllByText for multiple matches
    expect(screen.getAllByText(/270/).length).toBeGreaterThanOrEqual(1);
  });
});
