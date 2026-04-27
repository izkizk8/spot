import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock <Glass> with a host View that captures props for assertion.
jest.mock('@/components/glass', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    Glass: (props: Record<string, unknown>) =>
      ReactLib.createElement(
        View,
        {
          accessibilityLabel: 'glass-surface',
          'data-intensity': props.intensity,
          'data-tint': props.tint,
          'data-shape': props.shape,
        },
        props.children,
      ),
  };
});

import { PlaygroundScreen } from '@/modules/liquid-glass-playground/screen';

const SAFE_AREA_INITIAL = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 320, height: 640 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL}>
      <PlaygroundScreen />
    </SafeAreaProvider>,
  );
}

function firstSurface(api: ReturnType<typeof render>) {
  return api.getAllByLabelText('glass-surface')[0];
}

describe('<PlaygroundScreen>', () => {
  it('renders three glass surfaces with the initial state (intensity=0.55, tint=aqua, shape=rounded)', () => {
    const api = renderScreen();
    const surfaces = api.getAllByLabelText('glass-surface');
    expect(surfaces.length).toBe(3);
    for (const s of surfaces) {
      expect(s.props['data-intensity']).toBe(0.55);
      expect(s.props['data-tint']).toBe('rgba(60,159,254,0.35)'); // aqua
      expect(s.props['data-shape']).toBe('rounded');
    }
  });

  it('changing the blur intensity updates every Glass surface', () => {
    const api = renderScreen();
    fireEvent.press(api.getByLabelText('Set intensity to 0.95'));
    for (const s of api.getAllByLabelText('glass-surface')) {
      expect(s.props['data-intensity']).toBe(0.95);
    }
  });

  it('changing the tint updates every Glass surface', () => {
    const api = renderScreen();
    fireEvent.press(api.getByLabelText('Set tint to Rose'));
    expect(firstSurface(api).props['data-tint']).toBe('rgba(255,99,132,0.32)');
  });

  it('selecting tint "None" clears the tint', () => {
    const api = renderScreen();
    fireEvent.press(api.getByLabelText('Set tint to None'));
    expect(firstSurface(api).props['data-tint']).toBeUndefined();
  });

  it('changing the shape updates every Glass surface', () => {
    const api = renderScreen();
    fireEvent.press(api.getByLabelText('Set shape to Pill'));
    for (const s of api.getAllByLabelText('glass-surface')) {
      expect(s.props['data-shape']).toBe('pill');
    }
  });
});
