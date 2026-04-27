import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Per Jest's mock-factory rules, only `mock`-prefixed identifiers may be
// referenced from inside a jest.mock() factory.
const mockModulesRef: { current: unknown[] } = { current: [] };

jest.mock('@/modules/registry', () => ({
  get MODULES() {
    return mockModulesRef.current;
  },
}));

// <Link asChild> just clones its child in this stub so the inner Pressable
// (and its accessibility props) end up in the rendered tree.
jest.mock('expo-router', () => {
  const ReactLib = require('react');
  return {
    Link: ({ children }: { children: React.ReactElement }) => ReactLib.Children.only(children),
  };
});

// expo-symbols is iOS-native; render the documented fallback.
jest.mock('expo-symbols', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    SymbolView: (props: { fallback?: React.ReactNode }) =>
      ReactLib.createElement(View, null, props.fallback ?? null),
  };
});

import ModulesScreen from '@/app/modules';
import type { ModuleManifest } from '@/modules/types';

const SAFE_AREA_INITIAL = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 320, height: 640 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL}>
      <ModulesScreen />
    </SafeAreaProvider>,
  );
}

const supportedModule: ModuleManifest = {
  id: 'mod-a',
  title: 'Module A',
  description: 'Available everywhere.',
  icon: { ios: 'sparkles', fallback: '✦' },
  platforms: ['ios', 'android', 'web'],
  render: () => null,
};

const unsupportedModule: ModuleManifest = {
  id: 'mod-b',
  title: 'Module B',
  description: 'Only available on Android.',
  icon: { ios: 'sparkles', fallback: '✦' },
  platforms: ['android'],
  render: () => null,
};

describe('<ModulesScreen>', () => {
  it('renders the empty state when the registry is empty', () => {
    mockModulesRef.current = [];
    const { getByText } = renderScreen();
    expect(getByText(/No modules registered yet/i)).toBeTruthy();
  });

  it('renders one card per registered module with title and description', () => {
    mockModulesRef.current = [supportedModule, unsupportedModule];
    const { getByText } = renderScreen();
    expect(getByText('Module A')).toBeTruthy();
    expect(getByText('Module B')).toBeTruthy();
    expect(getByText('Available everywhere.')).toBeTruthy();
    expect(getByText('Only available on Android.')).toBeTruthy();
  });

  it('shows a platform badge for modules unavailable on the current platform', () => {
    mockModulesRef.current = [supportedModule, unsupportedModule];
    const { getByText, queryByText } = renderScreen();
    // Test runs on iOS (jest-expo default); mod-b is android-only -> badge.
    expect(getByText('android only')).toBeTruthy();
    // Supported module gets no platform badge of its own.
    expect(queryByText('iOS only')).toBeNull();
  });
});
