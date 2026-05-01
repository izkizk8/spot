import React from 'react';
import { View } from 'react-native';

// Mock recorder for animateToRegion calls
const animateToRegionCalls: Array<{
  region: unknown;
  duration?: number;
}> = [];

// Mock MapView component
const MapView = React.forwardRef((props: any, ref: any) => {
  const { mapType, region, showsUserLocation, children, ...rest } = props;

  // Expose animateToRegion method on ref
  React.useImperativeHandle(ref, () => ({
    animateToRegion: (targetRegion: unknown, duration?: number) => {
      animateToRegionCalls.push({ region: targetRegion, duration });
    },
  }));

  return (
    <View
      testID='map-view'
      {...rest}
      accessibilityState={{
        mapType,
        region: JSON.stringify(region),
        showsUserLocation,
      }}
    >
      {children}
    </View>
  );
});

// Mock Marker component
const Marker = (props: any) => {
  const { coordinate, children, ...rest } = props;
  return (
    <View
      testID='map-marker'
      {...rest}
      accessibilityState={{ coordinate: JSON.stringify(coordinate) }}
    >
      {children}
    </View>
  );
};

// Mock Polyline component
const Polyline = (props: any) => {
  const { coordinates, ...rest } = props;
  return (
    <View
      testID='map-polyline'
      {...rest}
      accessibilityState={{ coordinates: JSON.stringify(coordinates) }}
    />
  );
};

// Mock constants
const PROVIDER_GOOGLE = 'google';
const MAP_TYPES = {
  STANDARD: 'standard' as const,
  SATELLITE: 'satellite' as const,
  HYBRID: 'hybrid' as const,
  TERRAIN: 'terrain' as const,
  NONE: 'none' as const,
  MUTEDSTANDARD: 'mutedStandard' as const,
};

// Reset helper for tests
function __resetMapsMock() {
  animateToRegionCalls.length = 0;
}

// Expose calls for test assertions
function __getAnimateToRegionCalls() {
  return [...animateToRegionCalls];
}

export default MapView;
export { MapView, Marker, Polyline, PROVIDER_GOOGLE, MAP_TYPES };
export { __resetMapsMock, __getAnimateToRegionCalls };
