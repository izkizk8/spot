/**
 * Screen tests for Core Location Lab — Android variant (feature 025).
 *
 * Validates 4 functional cards plus IOSOnlyBanner for region monitoring.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

// Mock the hooks and components
jest.mock('@/modules/core-location-lab/hooks/useLocationUpdates', () => ({
  useLocationUpdates: () => ({
    running: false,
    start: jest.fn(),
    stop: jest.fn(),
    latest: null,
    samplesPerMinute: 0,
    error: null,
    accuracy: { label: 'Best', value: 6 },
    setAccuracy: jest.fn(),
    distanceFilter: { label: '5m', meters: 5 },
    setDistanceFilter: jest.fn(),
  }),
}));

jest.mock('@/modules/core-location-lab/hooks/useRegionMonitoring', () => ({
  useRegionMonitoring: () => ({
    regions: [],
    events: [],
    error: null,
    addRegion: jest.fn(),
    removeRegion: jest.fn(),
  }),
}));

jest.mock('@/modules/core-location-lab/hooks/useHeading', () => ({
  useHeading: () => ({
    running: false,
    start: jest.fn(),
    stop: jest.fn(),
    latest: null,
    samplesPerMinute: 0,
    error: null,
    isCalibrated: true,
  }),
}));

// Mock sensors-playground CompassNeedle
jest.mock('@/modules/sensors-playground/components/CompassNeedle', () => ({
  CompassNeedle: () => {
    const { View } = require('react-native');
    return <View testID="compass-needle" />;
  },
}));

// Mock expo-location
jest.mock('expo-location');

// Set platform to Android for these tests
const originalPlatform = Platform.OS;
beforeAll(() => {
  Object.defineProperty(Platform, 'OS', {
    get: () => 'android',
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(Platform, 'OS', {
    get: () => originalPlatform,
    configurable: true,
  });
});

// Import after mocks
import CoreLocationLabScreenAndroid from '@/modules/core-location-lab/screen.android';

describe('CoreLocationLabScreen (Android)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts without error', () => {
    expect(() => render(<CoreLocationLabScreenAndroid />)).not.toThrow();
  });

  it('renders PermissionsCard', () => {
    render(<CoreLocationLabScreenAndroid />);
    // Check for Permissions section header
    expect(screen.getAllByText(/permission/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders LiveUpdatesCard section', () => {
    render(<CoreLocationLabScreenAndroid />);
    // Check for section header
    expect(screen.getByText(/Live Updates/)).toBeTruthy();
  });

  it('renders IOSOnlyBanner when region monitoring section is expanded', () => {
    render(<CoreLocationLabScreenAndroid />);
    // Expand the region monitoring section
    const regionHeader = screen.getByTestId('section-header-region-monitoring');
    fireEvent.press(regionHeader);
    // Now should see iOS only banner
    expect(screen.getByText(/iOS only/i)).toBeTruthy();
  });

  it('renders Heading section', () => {
    render(<CoreLocationLabScreenAndroid />);
    expect(screen.getByText(/Heading/)).toBeTruthy();
  });

  it('renders SignificantChanges section', () => {
    render(<CoreLocationLabScreenAndroid />);
    expect(screen.getByText(/Significant Changes/)).toBeTruthy();
  });

  it('does not call startGeofencingAsync', () => {
    render(<CoreLocationLabScreenAndroid />);
    expect(Location.startGeofencingAsync).not.toHaveBeenCalled();
  });
});
