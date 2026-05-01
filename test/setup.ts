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

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
