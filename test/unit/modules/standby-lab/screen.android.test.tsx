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

  it('renders the iOS-17+-only banner at the top', async () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const view = render(<Screen />);
    await act(async () => {});
    expect(view.getByText('StandBy Mode is iOS 17+ only')).toBeTruthy();
  });

  it('renders the explainer card', async () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const view = render(<Screen />);
    await act(async () => {});
    expect(view.getByText(/about.*standby/i)).toBeTruthy();
  });

  it('config panel showcase / counter / tint / mode controls are interactive', async () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const view = render(<Screen />);
    await act(async () => {});
    expect(view.getByLabelText(/showcase/i)).toBeTruthy();
    expect(view.getByLabelText(/counter/i)).toBeTruthy();
    expect(view.getAllByLabelText(/tint/i).length).toBeGreaterThan(0);
    expect(view.getByLabelText(/Rendering mode Vibrant/i)).toBeTruthy();
  });

  it('the live preview reflects edits including the rendering-mode segment', async () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const view = render(<Screen />);
    await act(async () => {});
    fireEvent.press(view.getByLabelText(/Rendering mode Vibrant/i));
    fireEvent.press(view.getByLabelText(/Push to StandBy widget/i));
    // Preview's a11y label should now reflect "vibrant"
    expect(view.getByLabelText(/systemMedium.*vibrant/i)).toBeTruthy();
  });

  it('Push button is disabled and inline disabled-reason is shown', async () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const view = render(<Screen />);
    await act(async () => {});
    const btn = view.getByLabelText(/Push to StandBy widget/i);
    expect(btn.props.accessibilityState?.disabled).toBe(true);
    expect(view.getByText(/StandBy push requires iOS 17/)).toBeTruthy();
  });

  it('the setup instructions card is hidden', async () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const view = render(<Screen />);
    await act(async () => {});
    expect(view.queryByText(/set up standby/i)).toBeNull();
  });

  it('the reload event log is hidden', async () => {
    const Screen = require('@/modules/standby-lab/screen.android').default;
    const view = render(<Screen />);
    await act(async () => {});
    expect(view.queryByText(/no.*push/i)).toBeNull();
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
