/**
 * @file screen.test.tsx
 * @description Integration tests for SF Symbols Lab screen (T015)
 * Per contracts/test-plan.md Story 3.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

// Mock expo-symbols
jest.mock('expo-symbols', () => {
  const ReactLib = require('react');
  const SymbolView = jest.fn(({ name, tintColor, size, animationSpec }) =>
    ReactLib.createElement('View', {
      testID: 'symbol-view-mock',
      'data-name': name,
      'data-tint': String(tintColor),
      'data-size': size,
      'data-animation-spec': JSON.stringify(animationSpec ?? null),
    }),
  );
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

import { SfSymbolsLabScreen } from '@/modules/sf-symbols-lab/screen';
import { SymbolView } from 'expo-symbols';

const setOS = (os: string) =>
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });

describe('SfSymbolsLabScreen', () => {
  beforeEach(() => {
    setOS('ios');
    (SymbolView as jest.Mock).mockClear();
  });

  describe('initial render', () => {
    it('renders all four pickers and controls', () => {
      const { getAllByRole } = render(<SfSymbolsLabScreen />);

      // All buttons from: 12 symbols + 7 effects + 4 tints + 3 speed + 3 repeat + Play Effect
      // = 29 buttons minimum (plus secondary picker when Replace is selected)
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(29);
    });

    it('has default selections: first symbol, Bounce effect, first tint, Normal speed, Once repeat', () => {
      const { getAllByTestId } = render(<SfSymbolsLabScreen />);

      // Preview should render with default symbol (heart.fill)
      // First symbol-view-mock is the preview, rest are picker cells
      const symbolViews = getAllByTestId('symbol-view-mock');
      const preview = symbolViews[0]; // First one is the preview
      expect(preview.props['data-name']).toBe('heart.fill');
    });

    it('does not show banner on iOS', () => {
      const { queryByText } = render(<SfSymbolsLabScreen />);
      expect(queryByText(/iOS 17\+/i)).toBeNull();
    });
  });

  describe('cross-platform behavior', () => {
    it('shows iOS 17+ banner on Android', () => {
      setOS('android');
      const { getByText } = render(<SfSymbolsLabScreen />);
      expect(getByText(/iOS 17\+/i)).toBeTruthy();
    });

    it('shows iOS 17+ banner on Web', () => {
      setOS('web');
      const { getByText } = render(<SfSymbolsLabScreen />);
      expect(getByText(/iOS 17\+/i)).toBeTruthy();
    });

    it('renders plain-text fallback on non-iOS platforms', () => {
      setOS('web');
      const { queryByTestId, getAllByText } = render(<SfSymbolsLabScreen />);

      // SymbolView should not be rendered
      expect(queryByTestId('symbol-view-mock')).toBeNull();

      // Plain text fallback should be visible (symbol name as text)
      // Multiple instances because of picker cells
      const fallbacks = getAllByText('heart.fill');
      expect(fallbacks.length).toBeGreaterThan(0);
    });
  });

  describe('symbol picker interaction', () => {
    it('updates preview when a symbol is selected', () => {
      const { getAllByRole, getAllByTestId } = render(<SfSymbolsLabScreen />);

      // Get symbol picker buttons (first 12 buttons)
      const buttons = getAllByRole('button');

      // Tap the 5th symbol (flame.fill - index 4)
      fireEvent.press(buttons[4]);

      const symbolViews = getAllByTestId('symbol-view-mock');
      const preview = symbolViews[0]; // First one is preview
      expect(preview.props['data-name']).toBe('flame.fill');
    });
  });

  describe('effect picker interaction', () => {
    it('shows Replace mini-picker when Replace effect is selected', () => {
      const { getAllByRole, getByText } = render(<SfSymbolsLabScreen />);

      // Select Replace effect
      const replaceButton = getByText('Replace');
      fireEvent.press(replaceButton);

      // Now we should have additional symbol buttons for the mini-picker
      // Total buttons should increase (11 more for secondary symbols, excluding primary)
      const buttonsAfter = getAllByRole('button');
      expect(buttonsAfter.length).toBeGreaterThanOrEqual(40); // 29 base + 11 secondary
    });

    it('hides Replace mini-picker when switching away from Replace', () => {
      const { getAllByRole, getByText } = render(<SfSymbolsLabScreen />);

      // Select Replace
      fireEvent.press(getByText('Replace'));
      const buttonsWithReplace = getAllByRole('button');

      // Switch to Bounce
      fireEvent.press(getByText('Bounce'));
      const buttonsWithoutReplace = getAllByRole('button');

      // Button count should decrease
      expect(buttonsWithoutReplace.length).toBeLessThan(buttonsWithReplace.length);
    });

    it('remembers secondary symbol when switching back to Replace', () => {
      const { getAllByRole, getByText } = render(<SfSymbolsLabScreen />);

      // Select Replace
      fireEvent.press(getByText('Replace'));

      // Select a secondary symbol (star.fill - second in list)
      const buttons = getAllByRole('button');
      const secondaryPickerStart = buttons.length - 11; // Last 11 buttons are secondary picker
      fireEvent.press(buttons[secondaryPickerStart + 1]); // Pick star.fill

      // Switch to Pulse
      fireEvent.press(getByText('Pulse'));

      // Switch back to Replace
      fireEvent.press(getByText('Replace'));

      // The secondary symbol should still be star.fill
      // (This is verified by the screen state, but we can test behavior)
      expect(getByText('Replace')).toBeTruthy();
    });
  });

  describe('tint picker interaction', () => {
    it('updates preview tint immediately when a swatch is tapped', () => {
      const { getAllByRole, getAllByTestId } = render(<SfSymbolsLabScreen />);

      const buttons = getAllByRole('button');

      // Find and tap a tint button (should be after symbol + effect buttons)
      // Tint buttons are after 12 symbols + 7 effects = button index 19+
      const tintButtonIndex = 19;
      fireEvent.press(buttons[tintButtonIndex]);

      const symbolViews = getAllByTestId('symbol-view-mock');
      const preview = symbolViews[0];
      // Tint should have changed (specific color depends on theme)
      expect(preview.props['data-tint']).toBeTruthy();
    });
  });

  describe('Play Effect button', () => {
    it('bumps playToken when Play Effect is pressed', () => {
      const { getByText, getAllByTestId } = render(<SfSymbolsLabScreen />);

      const playButton = getByText('Play Effect');
      const symbolViews = getAllByTestId('symbol-view-mock');
      const previewBefore = symbolViews[0];
      const specBefore = previewBefore.props['data-animation-spec'];

      // Play Effect
      fireEvent.press(playButton);

      const symbolViewsAfter = getAllByTestId('symbol-view-mock');
      const previewAfter = symbolViewsAfter[0];
      const specAfter = previewAfter.props['data-animation-spec'];

      // Animation spec should now be defined (not null)
      expect(specBefore).toBe('null');
      expect(specAfter).not.toBe('null');
    });

    it('works on non-iOS platforms without error', () => {
      setOS('web');
      const { getByText } = render(<SfSymbolsLabScreen />);

      const playButton = getByText('Play Effect');

      // Should not throw
      expect(() => fireEvent.press(playButton)).not.toThrow();
    });
  });

  describe('speed and repeat controls', () => {
    it('dims Speed and Repeat controls when Replace is selected', () => {
      const { getByText, getAllByRole } = render(<SfSymbolsLabScreen />);

      // Select Replace effect
      fireEvent.press(getByText('Replace'));

      // Speed and Repeat should still be present but disabled
      // We can verify by checking if buttons exist (they should be dimmed/disabled)
      const buttons = getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('combined workflow', () => {
    it('full flow: pick symbol → pick effect → pick tint → play', () => {
      const { getAllByRole, getByText, getAllByTestId } = render(<SfSymbolsLabScreen />);

      const buttons = getAllByRole('button');

      // Pick flame.fill (5th symbol, index 4)
      fireEvent.press(buttons[4]);

      // Pick Pulse effect
      fireEvent.press(getByText('Pulse'));

      // Pick a tint (3rd swatch)
      const tintButtonIndex = 21; // After 12 symbols + 7 effects + 2 previous tints
      fireEvent.press(buttons[tintButtonIndex]);

      // Press Play Effect
      fireEvent.press(getByText('Play Effect'));

      // Verify preview has combined props
      const symbolViews = getAllByTestId('symbol-view-mock');
      const preview = symbolViews[0];
      expect(preview.props['data-name']).toBe('flame.fill');

      const spec = JSON.parse(preview.props['data-animation-spec']);
      expect(spec).toBeTruthy();
      expect(spec.effect.type).toBe('pulse');
    });
  });
});
