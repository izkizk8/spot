// Mock state
let mockStatus = 'undetermined' as 'undetermined' | 'denied' | 'granted' | 'restricted';
let mockCoords = { latitude: 37.78825, longitude: -122.4324 };
let mockThrowOnGet = false;

// Feature 025: Mock state for watch functions
type PositionCallback = (location: {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
    speed: number;
    heading: number;
  };
  timestamp: number;
}) => void;
type HeadingCallback = (heading: {
  magHeading: number;
  trueHeading: number;
  accuracy: number;
}) => void;

let mockWatchPositionCallback: PositionCallback | null = null;
let mockWatchHeadingCallback: HeadingCallback | null = null;
let mockWatchPositionThrow = false;
let mockWatchHeadingThrow = false;
let mockGeofencingThrow = false;
let subscriptionIdCounter = 0;

// Permission status enum
export enum PermissionStatus {
  UNDETERMINED = 'undetermined',
  DENIED = 'denied',
  GRANTED = 'granted',
  RESTRICTED = 'restricted',
}

// Feature 025: Location accuracy enum
// Values intentionally match expo-location's LocationAccuracy enum which has aliases
export const LocationAccuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
  Best: 6,
  Hundred: 3,
  Kilometer: 1,
} as const;

// Feature 025: Geofencing event types
export enum GeofencingEventType {
  Enter = 1,
  Exit = 2,
}

// Feature 025: Activity type enum
export enum ActivityType {
  Other = 1,
  AutomotiveNavigation = 2,
  Fitness = 3,
  OtherNavigation = 4,
  Airborne = 5,
}

// Alias for compatibility with Location.Accuracy
export const Accuracy = LocationAccuracy;

// Mock implementations
export const requestForegroundPermissionsAsync = jest.fn(async () => ({
  status: mockStatus,
  granted: mockStatus === 'granted',
  canAskAgain: mockStatus === 'undetermined',
  expires: 'never',
}));

export const requestBackgroundPermissionsAsync = jest.fn(async () => ({
  status: mockStatus,
  granted: mockStatus === 'granted',
  canAskAgain: mockStatus === 'undetermined',
  expires: 'never',
}));

export const getForegroundPermissionsAsync = jest.fn(async () => ({
  status: mockStatus,
  granted: mockStatus === 'granted',
  canAskAgain: mockStatus === 'undetermined',
  expires: 'never',
}));

export const getBackgroundPermissionsAsync = jest.fn(async () => ({
  status: mockStatus,
  granted: mockStatus === 'granted',
  canAskAgain: mockStatus === 'undetermined',
  expires: 'never',
}));

export const getCurrentPositionAsync = jest.fn(async () => {
  if (mockThrowOnGet) {
    throw new Error('Location not available');
  }
  return {
    coords: mockCoords,
    timestamp: Date.now(),
  };
});

// Feature 025: Watch position async
export const watchPositionAsync = jest.fn(
  async (
    _options: { accuracy?: number; distanceInterval?: number },
    callback: PositionCallback,
  ) => {
    if (mockWatchPositionThrow) {
      throw new Error('Location not available');
    }
    mockWatchPositionCallback = callback;
    const id = ++subscriptionIdCounter;
    return {
      remove: jest.fn(() => {
        if (mockWatchPositionCallback === callback) {
          mockWatchPositionCallback = null;
        }
      }),
      _id: id,
    };
  },
);

// Feature 025: Watch heading async
export const watchHeadingAsync = jest.fn(async (callback: HeadingCallback) => {
  if (mockWatchHeadingThrow) {
    throw new Error('Heading not available');
  }
  mockWatchHeadingCallback = callback;
  const id = ++subscriptionIdCounter;
  return {
    remove: jest.fn(() => {
      if (mockWatchHeadingCallback === callback) {
        mockWatchHeadingCallback = null;
      }
    }),
    _id: id,
  };
});

// Feature 025: Geofencing APIs
export const startGeofencingAsync = jest.fn(async (_taskName: string, _regions: unknown[]) => {
  if (mockGeofencingThrow) {
    throw new Error('Region monitoring failed');
  }
});

export const stopGeofencingAsync = jest.fn(async (_taskName: string) => {});

export const hasStartedGeofencingAsync = jest.fn(async (_taskName: string) => false);

// Feature 025: Significant location changes
export const startLocationUpdatesAsync = jest.fn(async (_taskName: string, _options?: unknown) => {
  if (mockWatchPositionThrow) {
    throw new Error('Location updates not available');
  }
});

export const stopLocationUpdatesAsync = jest.fn(async (_taskName: string) => {});

export const hasStartedLocationUpdatesAsync = jest.fn(async (_taskName: string) => false);

// Mock control helpers
export function __setLocationMock(opts: {
  status?: typeof mockStatus;
  coords?: typeof mockCoords;
  throwOnGet?: boolean;
}) {
  if (opts.status !== undefined) mockStatus = opts.status;
  if (opts.coords !== undefined) mockCoords = opts.coords;
  if (opts.throwOnGet !== undefined) mockThrowOnGet = opts.throwOnGet;
}

// Feature 025: New mock control helpers
export function __setWatchPositionMock(opts: { throwOnWatch?: boolean }) {
  if (opts.throwOnWatch !== undefined) mockWatchPositionThrow = opts.throwOnWatch;
}

export function __setWatchHeadingMock(opts: { throwOnWatch?: boolean }) {
  if (opts.throwOnWatch !== undefined) mockWatchHeadingThrow = opts.throwOnWatch;
}

export function __setGeofencingMock(opts: { throwOnStart?: boolean }) {
  if (opts.throwOnStart !== undefined) mockGeofencingThrow = opts.throwOnStart;
}

// Feature 025: Test helpers to simulate location/heading updates
export function __emitPosition(location: {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}) {
  if (mockWatchPositionCallback) {
    mockWatchPositionCallback({
      coords: {
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude ?? 0,
        accuracy: location.accuracy ?? 10,
        speed: location.speed ?? 0,
        heading: location.heading ?? 0,
      },
      timestamp: Date.now(),
    });
  }
}

export function __emitHeading(heading: {
  magHeading: number;
  trueHeading?: number;
  accuracy?: number;
}) {
  if (mockWatchHeadingCallback) {
    mockWatchHeadingCallback({
      magHeading: heading.magHeading,
      trueHeading: heading.trueHeading ?? heading.magHeading,
      accuracy: heading.accuracy ?? 1,
    });
  }
}

export function __resetLocationMock() {
  mockStatus = 'undetermined';
  mockCoords = { latitude: 37.78825, longitude: -122.4324 };
  mockThrowOnGet = false;
  mockWatchPositionCallback = null;
  mockWatchHeadingCallback = null;
  mockWatchPositionThrow = false;
  mockWatchHeadingThrow = false;
  mockGeofencingThrow = false;
  subscriptionIdCounter = 0;
  jest.clearAllMocks();
}
