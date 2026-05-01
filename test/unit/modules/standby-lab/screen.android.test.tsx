/**
 * Tests for screen.android.tsx (Android fallback).
 *
 * @see specs/028-standby-mode/tasks.md T037
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Platform } from 'react-native';

const mockSaveSpy = jest.fn();

jest.mock('@/modules/standby-lab/standby-config', () => {
  const actual = jest.requireActual('@/modules/standby-lab/standby-config');
  return {
    ...actual,
    saveShadowStandByConfig: (...args: unknown[]) => {
      mockSaveSpy(...args);
      return Promise.resolve();
    },
    loadShadowStandByConfig: jest.fn().mockResolvedValue(actual.DEFAULT_STANDBY_CONFIG),
  };
});

describe('StandByLabScreen.android (fallback)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveSpy.mockClear();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  });

  it('renders the iOS-17+-only banner at the top', () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const { getByText } = render(<Screen />);
    expect(getByText('StandBy Mode is iOS 17+ only')).toBeTruthy();
  });

  it('renders the explainer card', () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const { getByText } = render(<Screen />);
    expect(getByText(/about.*standby/i)).toBeTruthy();
  });

  it('config panel showcase / counter / tint / mode controls are interactive', () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const { getByLabelText, getAllByLabelText } = render(<Screen />);
    expect(getByLabelText(/showcase/i)).toBeTruthy();
    expect(getByLabelText(/counter/i)).toBeTruthy();
    expect(getAllByLabelText(/tint/i).length).toBeGreaterThan(0);
    expect(getByLabelText(/Rendering mode Vibrant/i)).toBeTruthy();
  });

  it('the live preview reflects edits including the rendering-mode segment', () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const { getByLabelText } = render(<Screen />);
    fireEvent.press(getByLabelText(/Rendering mode Vibrant/i));
    fireEvent.press(getByLabelText(/Push to StandBy widget/i));
    // Preview's a11y label should now reflect "vibrant"
    expect(getByLabelText(/systemMedium.*vibrant/i)).toBeTruthy();
  });

  it('Push button is disabled and inline disabled-reason is shown', () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const { getByLabelText, getByText } = render(<Screen />);
    const btn = getByLabelText(/Push to StandBy widget/i);
    expect(btn.props.accessibilityState?.disabled).toBe(true);
    expect(getByText(/StandBy push requires iOS 17/)).toBeTruthy();
  });

  it('the setup instructions card is hidden', () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const { queryByText } = render(<Screen />);
    expect(queryByText(/set up standby/i)).toBeNull();
  });

  it('the reload event log is hidden', () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const { queryByText } = render(<Screen />);
    expect(queryByText(/no.*push/i)).toBeNull();
  });

  it('edits round-trip to AsyncStorage shadow store via saveShadowStandByConfig', async () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const { getByLabelText, findByLabelText } = render(<Screen />);
    // Wait for initial loadShadow effect to settle so configEpoch is stable.
    await findByLabelText('Showcase value');
    await act(async () => {
      await new Promise<void>((resolve) => setImmediate(resolve));
    });
    mockSaveSpy.mockClear();
    await act(async () => {
      fireEvent.changeText(getByLabelText('Showcase value'), 'Hi');
      fireEvent.press(getByLabelText(/Rendering mode Accented/i));
      await new Promise<void>((resolve) => setImmediate(resolve));
    });
    expect(mockSaveSpy).toHaveBeenCalled();
    const lastArg = mockSaveSpy.mock.calls[mockSaveSpy.mock.calls.length - 1][0];
    expect(lastArg.showcaseValue).toBe('Hi');
    expect(lastArg.mode).toBe('accented');
  });
});
