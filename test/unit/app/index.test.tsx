import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

// expo-router's <Link asChild> just clones its child — emulate that so the
// inner Pressable (with our accessibility props) lands in the tree.
jest.mock('expo-router', () => {
  const ReactLib = require('react');
  return {
    Link: ({ children }: { children: React.ReactElement }) => ReactLib.Children.only(children),
  };
});

// Reanimated's stock `mock` entry boots Worklets, which fails outside RN.
// Provide a minimal local mock that satisfies HomeScreen's surface area.
jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  const animation = {
    duration: () => animation,
    delay: () => animation,
    easing: () => animation,
  };
  return {
    __esModule: true,
    default: {
      View: (props: Record<string, unknown> & { children?: React.ReactNode }) =>
        ReactLib.createElement(View, props, props.children),
    },
    Easing: { out: () => () => 0, cubic: () => 0 },
    FadeIn: animation,
    FadeInDown: animation,
    useReducedMotion: () => false,
  };
});

// safe-area-context's SafeAreaView falls back to a plain View when no
// provider is mounted — but the View needs to mount, so wire a minimal stub.
jest.mock('react-native-safe-area-context', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown> & { children?: React.ReactNode }) =>
      ReactLib.createElement(View, props, props.children),
  };
});

import HomeScreen from '@/app/index';

describe('<HomeScreen>', () => {
  it('renders the app title in the hero', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Spot')).toBeTruthy();
  });

  it('renders an interactive CTA element pointing at the modules tab', () => {
    const { getByLabelText } = render(<HomeScreen />);
    const cta = getByLabelText('Browse modules');
    expect(cta).toBeTruthy();
    // Either a link or a button is acceptable per the spec — we use "link".
    expect(['link', 'button']).toContain(cta.props.accessibilityRole);
  });
});
