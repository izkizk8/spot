// Mock state
let mockStatus = 'undetermined' as 'undetermined' | 'denied' | 'granted' | 'restricted';
let mockCoords = { latitude: 37.78825, longitude: -122.4324 };
let mockThrowOnGet = false;

// Permission status enum
export enum PermissionStatus {
  UNDETERMINED = 'undetermined',
  DENIED = 'denied',
  GRANTED = 'granted',
  RESTRICTED = 'restricted',
}

// Mock implementations
export const requestForegroundPermissionsAsync = jest.fn(async () => ({
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

export const getCurrentPositionAsync = jest.fn(async () => {
  if (mockThrowOnGet) {
    throw new Error('Location not available');
  }
  return {
    coords: mockCoords,
    timestamp: Date.now(),
  };
});

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

export function __resetLocationMock() {
  mockStatus = 'undetermined';
  mockCoords = { latitude: 37.78825, longitude: -122.4324 };
  mockThrowOnGet = false;
  jest.clearAllMocks();
}
