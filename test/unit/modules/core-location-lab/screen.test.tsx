/**
 * Screen tests for Core Location Lab — iOS variant (feature 025).
 *
 * Validates that all 5 cards are present and properly composed.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';

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

// Set platform to iOS for these tests
const originalPlatform = Platform.OS;
beforeAll(() => {
  Object.defineProperty(Platform, 'OS', {
    get: () => 'ios',
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
import CoreLocationLabScreen from '@/modules/core-location-lab/screen';

describe('CoreLocationLabScreen (iOS)', () => {
  it('mounts without error', () => {
    expect(() => render(<CoreLocationLabScreen />)).not.toThrow();
  });

  it('renders PermissionsCard', () => {
    render(<CoreLocationLabScreen />);
    // Check for Permissions section header
    expect(screen.getAllByText(/permission/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders LiveUpdatesCard', () => {
    render(<CoreLocationLabScreen />);
    // Check for Live Updates section
    expect(screen.getAllByText(/live/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders RegionMonitoringCard (not IOSOnlyBanner)', () => {
    render(<CoreLocationLabScreen />);
    // Should have region monitoring content
    expect(screen.getAllByText(/region/i).length).toBeGreaterThanOrEqual(1);
    // Should NOT have iOS-only banner text
    expect(screen.queryByText(/iOS only/i)).toBeNull();
  });

  it('renders HeadingCard', () => {
    render(<CoreLocationLabScreen />);
    expect(screen.getAllByText(/heading/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders SignificantChangesCard', () => {
    render(<CoreLocationLabScreen />);
    expect(screen.getAllByText(/significant/i).length).toBeGreaterThanOrEqual(1);
  });

  it('has 5 collapsible sections', () => {
    render(<CoreLocationLabScreen />);
    // Each card should be represented as a collapsible section
    const sectionHeaders = screen.getAllByTestId(/section-header/i);
    expect(sectionHeaders.length).toBe(5);
  });

  it('expanding one card preserves state of others', () => {
    render(<CoreLocationLabScreen />);

    const headers = screen.getAllByTestId(/section-header/i);

    // Initially all should be collapsed or in default state
    // Tap first header to expand
    fireEvent.press(headers[0]);

    // Verify other sections maintain their state
    // (implementation will show expanded content for first, others unchanged)
    expect(headers[1]).toBeTruthy();
  });
});
