import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Jest hoists jest.mock() above imports — only identifiers prefixed with
// `mock` may be referenced from inside the factory.
const mockSetPreference = jest.fn();
const mockPrefRef: { current: 'system' | 'light' | 'dark' } = { current: 'light' };

jest.mock('@/theme/use-theme-preference', () => ({
  useThemePreference: () => ({
    preference: mockPrefRef.current,
    setPreference: mockSetPreference,
    loaded: true,
  }),
  usePreference: () => mockPrefRef.current,
  useSetPreference: () => mockSetPreference,
  usePreferenceLoaded: () => true,
}));

import SettingsScreen from '@/app/settings';

const SAFE_AREA_INITIAL = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 320, height: 640 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL}>
      <SettingsScreen />
    </SafeAreaProvider>,
  );
}

describe('<SettingsScreen>', () => {
  it('renders the three appearance options', () => {
    mockPrefRef.current = 'system';
    mockSetPreference.mockClear();
    const { getByLabelText } = renderScreen();
    expect(getByLabelText('System')).toBeTruthy();
    expect(getByLabelText('Light')).toBeTruthy();
    expect(getByLabelText('Dark')).toBeTruthy();
  });

  it('marks the option matching the current preference as selected', () => {
    mockPrefRef.current = 'light';
    mockSetPreference.mockClear();
    const { getByLabelText } = renderScreen();
    expect(getByLabelText('Light').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(getByLabelText('System').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
    expect(getByLabelText('Dark').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });

  it('pressing a different option calls setPreference with that value', () => {
    mockPrefRef.current = 'system';
    mockSetPreference.mockClear();
    const { getByLabelText } = renderScreen();
    fireEvent.press(getByLabelText('Dark'));
    expect(mockSetPreference).toHaveBeenCalledWith('dark');
  });
});
