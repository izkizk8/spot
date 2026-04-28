/**
 * Screen tests for Core Location Lab — Web variant (feature 025).
 *
 * Validates web-specific behavior with coarse location note.
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

// Set platform to Web for these tests
const originalPlatform = Platform.OS;
beforeAll(() => {
  Object.defineProperty(Platform, 'OS', {
    get: () => 'web',
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
import CoreLocationLabScreenWeb from '@/modules/core-location-lab/screen.web';

describe('CoreLocationLabScreen (Web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts without error', () => {
    expect(() => render(<CoreLocationLabScreenWeb />)).not.toThrow();
  });

  it('renders PermissionsCard', () => {
    render(<CoreLocationLabScreenWeb />);
    // Check for Permissions section header
    expect(screen.getAllByText(/permission/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders LiveUpdatesCard section', () => {
    render(<CoreLocationLabScreenWeb />);
    expect(screen.getByText(/Live Updates/)).toBeTruthy();
  });

  it('renders IOSOnlyBanner when region monitoring section is expanded', () => {
    render(<CoreLocationLabScreenWeb />);
    // Expand the region monitoring section
    const regionHeader = screen.getByTestId('section-header-region-monitoring');
    fireEvent.press(regionHeader);
    // Now should see iOS only banner
    expect(screen.getByText(/iOS only/i)).toBeTruthy();
  });

  it('renders Heading section', () => {
    render(<CoreLocationLabScreenWeb />);
    expect(screen.getByText(/Heading/)).toBeTruthy();
  });

  it('shows "Coarse on web" note when Significant Changes section is expanded', () => {
    render(<CoreLocationLabScreenWeb />);
    // Expand the significant changes section
    const significantHeader = screen.getByTestId('section-header-significant-changes');
    fireEvent.press(significantHeader);
    // Should have a note about web limitations - use getAllByText for multiple matches
    expect(screen.getAllByText(/web/i).length).toBeGreaterThanOrEqual(1);
  });

  it('significant changes toggle is inert on web', () => {
    render(<CoreLocationLabScreenWeb />);
    // Expand the significant changes section
    const significantHeader = screen.getByTestId('section-header-significant-changes');
    fireEvent.press(significantHeader);

    // Find and toggle the switch
    const toggle = screen.getByRole('switch');
    fireEvent(toggle, 'valueChange', true);

    // Should not invoke native location services
    expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('does not call startGeofencingAsync', () => {
    render(<CoreLocationLabScreenWeb />);
    expect(Location.startGeofencingAsync).not.toHaveBeenCalled();
  });
});
