import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

// Mock expo-glass-effect: GlassView captures props on a host View; helper
// reports liquid glass as available so we exercise the native branch.
jest.mock('expo-glass-effect', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    isLiquidGlassAvailable: () => true,
    GlassView: (props: Record<string, unknown>) =>
      ReactLib.createElement(
        View,
        {
          testID: 'glass-view',
          // Capture the props so tests can inspect them.
          'data-glass-effect-style': props.glassEffectStyle,
          'data-tint-color': props.tintColor,
          'data-is-interactive': props.isInteractive,
          style: props.style,
        },
        props.children,
      ),
  };
});

import { Glass } from '@/components/glass';

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

describe('<Glass> (iOS native, liquid glass available)', () => {
  it('passes high intensity through as the "regular" preset and forwards tint', () => {
    const { getByTestId } = render(
      <Glass intensity={0.8} tint='rgba(60,159,254,0.35)' shape='rounded'>
        <Text>child</Text>
      </Glass>,
    );
    const view = getByTestId('glass-view');
    expect(view.props['data-glass-effect-style']).toBe('regular');
    expect(view.props['data-tint-color']).toBe('rgba(60,159,254,0.35)');
    expect(view.props['data-is-interactive']).toBe(true);
  });

  it('passes low intensity through as the "clear" preset', () => {
    const { getByTestId } = render(
      <Glass intensity={0.2}>
        <Text>x</Text>
      </Glass>,
    );
    expect(getByTestId('glass-view').props['data-glass-effect-style']).toBe('clear');
  });

  it.each([
    ['rounded' as const, 24],
    ['pill' as const, 9999],
    ['circle' as const, 9999],
  ])('derives borderRadius from shape="%s"', (shape, expected) => {
    const { getByTestId } = render(
      <Glass shape={shape}>
        <Text>x</Text>
      </Glass>,
    );
    const style = flattenStyle(getByTestId('glass-view').props.style);
    expect(style.borderRadius).toBe(expected);
  });

  it('renders children inside the glass surface', () => {
    const { getByText } = render(
      <Glass>
        <Text>child-content</Text>
      </Glass>,
    );
    expect(getByText('child-content')).toBeTruthy();
  });
});
