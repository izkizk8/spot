/**
 * @file manifest.test.ts
 * @description Per-module manifest tests for SF Symbols Lab (T014)
 * Per contracts/test-plan.md Story 3.
 */

import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

// Mock expo-symbols
jest.mock('expo-symbols', () => {
  const ReactLib = require('react');
  const SymbolView = jest.fn(() => ReactLib.createElement('View'));
  return { SymbolView };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
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
    Keyframe,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withSequence: (...vs: unknown[]) => vs[vs.length - 1],
  };
});

import manifest from '@/modules/sf-symbols-lab';

describe('sf-symbols-lab manifest', () => {
  it('has the expected id', () => {
    expect(manifest.id).toBe('sf-symbols-lab');
  });

  it('id matches the required pattern', () => {
    expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('declares all three platforms', () => {
    const platforms = new Set(manifest.platforms);
    expect(platforms).toEqual(new Set(['ios', 'android', 'web']));
  });

  it('declares minIOS 17.0', () => {
    expect(manifest.minIOS).toBe('17.0');
  });

  it('render is a function returning a React element', () => {
    expect(typeof manifest.render).toBe('function');
    const node = manifest.render();
    expect(React.isValidElement(node)).toBe(true);
  });
});
