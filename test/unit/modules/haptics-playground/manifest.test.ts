import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: Record<string, unknown> & { children?: React.ReactNode }) =>
        ReactLib.createElement(View, props, props.children),
    },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withSequence: (...vs: unknown[]) => vs[vs.length - 1],
  };
});

import manifest from '@/modules/haptics-playground';

describe('haptics-playground manifest', () => {
  it('has the expected id', () => {
    expect(manifest.id).toBe('haptics-playground');
  });

  it('declares all three platforms', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('does not declare a minIOS', () => {
    expect(manifest.minIOS).toBeUndefined();
  });

  it('render is a function returning a React element', () => {
    expect(typeof manifest.render).toBe('function');
    const node = manifest.render();
    expect(React.isValidElement(node)).toBe(true);
  });
});
