/**
 * Live Stickers Lab Screen Test (iOS)
 * Feature: 083-live-stickers
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';

import Screen from '@/modules/live-stickers-lab/screen';
import { __setLiveStickersBridgeForTests } from '@/modules/live-stickers-lab/hooks/useLiveStickers';
import type { LiveStickersBridge, LiveStickersResult } from '@/native/live-stickers.types';

function makeBridge(overrides: Partial<LiveStickersBridge> = {}): LiveStickersBridge {
  return {
    isSupported: jest.fn(() => true),
    pickImageAndLiftSubjects: jest.fn(
      async (): Promise<LiveStickersResult> => ({
        subjects: [{ base64Png: 'abc123', rect: { x: 0, y: 0, width: 100, height: 100 } }],
      }),
    ),
    shareSticker: jest.fn(async () => {}),
    ...overrides,
  };
}

describe('LiveStickersLabScreen (iOS)', () => {
  let bridge: LiveStickersBridge;

  beforeEach(() => {
    bridge = makeBridge();
    __setLiveStickersBridgeForTests(bridge);
  });

  afterEach(() => {
    __setLiveStickersBridgeForTests(null);
  });

  it('renders the Live Stickers title', () => {
    const { getByText } = render(<Screen />);
    expect(getByText('Live Stickers')).toBeTruthy();
  });

  it('renders the Pick Photo button', () => {
    const { getByTestId } = render(<Screen />);
    expect(getByTestId('pick-photo-button')).toBeTruthy();
  });

  it('Pick Photo button is enabled when isSupported is true', () => {
    const { getByTestId } = render(<Screen />);
    const btn = getByTestId('pick-photo-button');
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('Pick Photo button is disabled when isSupported is false', () => {
    __setLiveStickersBridgeForTests(makeBridge({ isSupported: jest.fn(() => false) }));
    const { getByTestId } = render(<Screen />);
    expect(getByTestId('pick-photo-button').props.accessibilityState?.disabled).toBe(true);
  });

  it('shows subject card after successful pick', async () => {
    const { getByTestId } = render(<Screen />);
    await act(async () => {
      fireEvent.press(getByTestId('pick-photo-button'));
    });
    expect(getByTestId('subject-card-0')).toBeTruthy();
  });

  it('shows share button per subject', async () => {
    const { getByTestId } = render(<Screen />);
    await act(async () => {
      fireEvent.press(getByTestId('pick-photo-button'));
    });
    expect(getByTestId('share-button-0')).toBeTruthy();
  });

  it('shows error card when pick fails', async () => {
    __setLiveStickersBridgeForTests(
      makeBridge({
        pickImageAndLiftSubjects: jest.fn(async () => {
          throw new Error('CANCELLED');
        }),
      }),
    );
    const { getByTestId } = render(<Screen />);
    await act(async () => {
      fireEvent.press(getByTestId('pick-photo-button'));
    });
    expect(getByTestId('error-card')).toBeTruthy();
  });

  it('reset button appears after successful pick', async () => {
    const { getByTestId } = render(<Screen />);
    await act(async () => {
      fireEvent.press(getByTestId('pick-photo-button'));
    });
    expect(getByTestId('reset-button')).toBeTruthy();
  });
});
