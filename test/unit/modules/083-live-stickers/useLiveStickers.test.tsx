/**
 * useLiveStickers hook tests.
 * Feature: 083-live-stickers
 *
 * The native bridge is mocked at the import boundary via
 * `__setLiveStickersBridgeForTests`. The hook is exercised inside a
 * minimal React component via @testing-library/react-native.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import {
  __setLiveStickersBridgeForTests,
  useLiveStickers,
  type UseLiveStickersReturn,
} from '@/modules/live-stickers-lab/hooks/useLiveStickers';
import type { LiveStickersBridge, LiveStickersResult } from '@/native/live-stickers.types';
import { LiveStickersNotSupported } from '@/native/live-stickers.types';

function makeBridge(overrides: Partial<LiveStickersBridge> = {}): LiveStickersBridge {
  return {
    isSupported: jest.fn(() => true),
    pickImageAndLiftSubjects: jest.fn(
      async (): Promise<LiveStickersResult> => ({
        subjects: [
          {
            base64Png: 'abc123',
            rect: { x: 0, y: 0, width: 100, height: 100 },
          },
        ],
      }),
    ),
    shareSticker: jest.fn(async (_base64Png: string): Promise<void> => {}),
    ...overrides,
  };
}

const handle: { current: UseLiveStickersReturn | null } = { current: null };

function Probe() {
  const r = useLiveStickers();
  React.useEffect(() => {
    handle.current = r;
  });
  return <Text testID='probe'>probe</Text>;
}

describe('useLiveStickers', () => {
  let bridge: LiveStickersBridge;

  beforeEach(() => {
    handle.current = null;
    bridge = makeBridge();
    __setLiveStickersBridgeForTests(bridge);
  });

  afterEach(() => {
    __setLiveStickersBridgeForTests(null);
  });

  it('reports isSupported from the bridge', () => {
    render(<Probe />);
    expect(handle.current?.isSupported).toBe(true);
    expect(bridge.isSupported).toHaveBeenCalled();
  });

  it('starts with null result and no error', () => {
    render(<Probe />);
    expect(handle.current?.result).toBeNull();
    expect(handle.current?.error).toBeNull();
    expect(handle.current?.isLoading).toBe(false);
  });

  it('pickAndLift sets result on success', async () => {
    const { getByTestId } = render(<Probe />);
    await act(async () => {
      await handle.current?.pickAndLift();
    });
    expect(bridge.pickImageAndLiftSubjects).toHaveBeenCalledTimes(1);
    expect(handle.current?.result?.subjects).toHaveLength(1);
    expect(handle.current?.result?.subjects[0].base64Png).toBe('abc123');
    expect(handle.current?.error).toBeNull();
    expect(getByTestId('probe')).toBeTruthy();
  });

  it('pickAndLift sets error on failure', async () => {
    const failBridge = makeBridge({
      pickImageAndLiftSubjects: jest.fn(async () => {
        throw new LiveStickersNotSupported('No subject found', 'NO_SUBJECT_FOUND');
      }),
    });
    __setLiveStickersBridgeForTests(failBridge);
    render(<Probe />);
    await act(async () => {
      await handle.current?.pickAndLift();
    });
    expect(handle.current?.error).toBe('No subject found');
    expect(handle.current?.result).toBeNull();
  });

  it('shareSticker calls bridge and clears loading', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.shareSticker('pngdata');
    });
    expect(bridge.shareSticker).toHaveBeenCalledWith('pngdata');
    expect(handle.current?.isLoading).toBe(false);
  });

  it('shareSticker sets error on failure', async () => {
    const failBridge = makeBridge({
      shareSticker: jest.fn(async () => {
        throw new Error('Share cancelled');
      }),
    });
    __setLiveStickersBridgeForTests(failBridge);
    render(<Probe />);
    await act(async () => {
      await handle.current?.shareSticker('data');
    });
    expect(handle.current?.error).toBe('Share cancelled');
  });

  it('reset clears result and error', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.pickAndLift();
    });
    expect(handle.current?.result).not.toBeNull();
    act(() => {
      handle.current?.reset();
    });
    expect(handle.current?.result).toBeNull();
    expect(handle.current?.error).toBeNull();
    expect(handle.current?.isLoading).toBe(false);
  });

  it('isSupported is false when bridge reports false', () => {
    const unsupportedBridge = makeBridge({ isSupported: jest.fn(() => false) });
    __setLiveStickersBridgeForTests(unsupportedBridge);
    render(<Probe />);
    expect(handle.current?.isSupported).toBe(false);
  });
});
