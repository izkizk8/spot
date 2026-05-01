/**
 * Tests for screen.web.tsx (Web fallback). Mirrors the Android suite.
 *
 * @see specs/028-standby-mode/tasks.md T038
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

describe('StandByLabScreen.web (fallback)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveSpy.mockClear();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  });

  it('renders the banner', () => {
    const Screen = require('@/modules/standby-lab/screen.web').default;
    const { getByText } = render(<Screen />);
    expect(getByText('StandBy Mode is iOS 17+ only')).toBeTruthy();
  });

  it('renders the explainer card', () => {
    const Screen = require('@/modules/standby-lab/screen.web').default;
    const { getByText } = render(<Screen />);
    expect(getByText(/about.*standby/i)).toBeTruthy();
  });

  it('config panel controls including rendering mode are present and interactive', () => {
    const Screen = require('@/modules/standby-lab/screen.web').default;
    const { getByLabelText } = render(<Screen />);
    expect(getByLabelText(/showcase/i)).toBeTruthy();
    expect(getByLabelText(/counter/i)).toBeTruthy();
    expect(getByLabelText(/Rendering mode Accented/i)).toBeTruthy();
  });

  it('the live preview reflects edits including rendering-mode', () => {
    const Screen = require('@/modules/standby-lab/screen.web').default;
    const { getByLabelText } = render(<Screen />);
    fireEvent.press(getByLabelText(/Rendering mode Accented/i));
    expect(getByLabelText(/systemMedium.*accented/i)).toBeTruthy();
  });

  it('Push button is disabled with inline reason', () => {
    const Screen = require('@/modules/standby-lab/screen.web').default;
    const { getByLabelText, getByText } = render(<Screen />);
    expect(getByLabelText(/Push to StandBy widget/i).props.accessibilityState?.disabled).toBe(true);
    expect(getByText(/StandBy push requires iOS 17/)).toBeTruthy();
  });

  it('setup instructions card is hidden', () => {
    const Screen = require('@/modules/standby-lab/screen.web').default;
    const { queryByText } = render(<Screen />);
    expect(queryByText(/set up standby/i)).toBeNull();
  });

  it('reload event log is hidden', () => {
    const Screen = require('@/modules/standby-lab/screen.web').default;
    const { queryByText } = render(<Screen />);
    expect(queryByText(/no.*push/i)).toBeNull();
  });

  it('edits persist to AsyncStorage shadow store via saveShadowStandByConfig', async () => {
    const Screen = require('@/modules/standby-lab/screen.web').default;
    const { getByLabelText, findByLabelText } = render(<Screen />);
    await findByLabelText('Showcase value');
    await act(async () => {
      await new Promise<void>((resolve) => setImmediate(resolve));
    });
    mockSaveSpy.mockClear();
    await act(async () => {
      fireEvent.changeText(getByLabelText('Showcase value'), 'Web');
      fireEvent.press(getByLabelText(/Rendering mode Vibrant/i));
      await new Promise<void>((resolve) => setImmediate(resolve));
    });
    expect(mockSaveSpy).toHaveBeenCalled();
    const last = mockSaveSpy.mock.calls[mockSaveSpy.mock.calls.length - 1][0];
    expect(last.showcaseValue).toBe('Web');
    expect(last.mode).toBe('vibrant');
  });
});
