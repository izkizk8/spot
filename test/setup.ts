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

// Mock expo-secure-store (feature 023)
jest.mock('expo-secure-store', () => require('@test/__mocks__/expo-secure-store'));
