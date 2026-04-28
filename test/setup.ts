import 'react-native-gesture-handler/jestSetup';

jest.mock('@/global.css', () => ({}), { virtual: true });

jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');

  return {
    Image: (props: unknown) => React.createElement(Image, props),
  };
});

jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const animation = {
    duration: () => animation,
    delay: () => animation,
    easing: () => animation,
    withCallback: () => animation,
  };
  class Keyframe {
    duration() {
      return this;
    }
    delay() {
      return this;
    }
    withCallback() {
      return this;
    }
  }
  return {
    __esModule: true,
    default: {
      View: (props: Record<string, unknown> & { children?: React.ReactNode }) =>
        ReactLib.createElement(View, props, props.children),
    },
    Easing: { out: () => () => 0, cubic: () => 0 },
    FadeIn: animation,
    FadeInDown: animation,
    Keyframe,
    useReducedMotion: () => false,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withSequence: (...vs: unknown[]) => vs[vs.length - 1],
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: true,
      assets: [],
    }),
  ),
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' }),
  ),
}));

// Mock native keychain bridge (feature 023)
jest.mock('@/native/keychain', () => {
  const mock = require('@test/__mocks__/native-keychain');
  return { keychain: mock.keychain };
});

// Mock react-native-maps (feature 024)
jest.mock('react-native-maps', () => jest.requireActual('@test/__mocks__/react-native-maps'));

// Mock expo-location (feature 024)
jest.mock('expo-location', () => jest.requireActual('@test/__mocks__/expo-location'));

// Mock expo-task-manager (feature 025)
jest.mock('expo-task-manager', () => jest.requireActual('@test/__mocks__/expo-task-manager'));

// Mock the MapKit native bridges directly (feature 024).
// Mocking expo-modules-core globally breaks `requireNativeModule` for other
// consumers (expo-clipboard etc.) because jest-expo's preset doesn't kick in
// once we replace the module. Mock the bridges at the import boundary instead.
jest.mock('@/native/mapkit-search', () => {
  const mock = require('@test/__mocks__/native-mapkit-search');
  return {
    __esModule: true,
    default: {
      async searchLocations(query: string, region: unknown) {
        const native = mock.__mockRequireOptionalNativeModule('SpotMapKitSearch');
        if (!native) {
          const types = require('@/native/mapkit-search.types');
          throw new types.MapKitNotSupportedError('searchLocations');
        }
        return native.search(query, region);
      },
    },
  };
});
jest.mock('@/native/lookaround', () => {
  const mock = require('@test/__mocks__/native-lookaround');
  return {
    __esModule: true,
    default: {
      async presentLookAround(lat: number, lng: number) {
        const native = mock.__mockRequireOptionalNativeModule('SpotLookAround');
        if (!native) {
          const types = require('@/native/mapkit-search.types');
          throw new types.MapKitNotSupportedError('presentLookAround');
        }
        return native.presentLookAround(lat, lng);
      },
    },
  };
});

// Reset mocks before each test
beforeEach(() => {
  const mapsMock = jest.requireActual('@test/__mocks__/react-native-maps');
  const locationMock = jest.requireActual('@test/__mocks__/expo-location');
  const searchMock = jest.requireActual('@test/__mocks__/native-mapkit-search');
  const lookAroundMock = jest.requireActual('@test/__mocks__/native-lookaround');
  const taskManagerMock = jest.requireActual('@test/__mocks__/expo-task-manager');

  if (mapsMock.__resetMapsMock) mapsMock.__resetMapsMock();
  if (locationMock.__resetLocationMock) locationMock.__resetLocationMock();
  if (searchMock.__resetSearchMock) searchMock.__resetSearchMock();
  if (lookAroundMock.__resetLookAroundMock) lookAroundMock.__resetLookAroundMock();
  if (taskManagerMock.__resetTaskManagerMock) taskManagerMock.__resetTaskManagerMock();
});
