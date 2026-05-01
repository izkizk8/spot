/**
 * Live Stickers Bridge — iOS variant (feature 083).
 *
 * Single seam where the `LiveStickers` Expo Module is touched. Resolved
 * via `requireOptionalNativeModule` so the surface is null-safe in
 * unit tests where the module is absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  LiveStickersNotSupported,
  type LiveStickersBridge,
  type LiveStickersResult,
} from './live-stickers.types';

export { LiveStickersNotSupported };

interface NativeLiveStickers {
  isSupported(): boolean;
  pickImageAndLiftSubjects(): Promise<LiveStickersResult>;
  shareSticker(base64Png: string): Promise<void>;
}

function getNative(): NativeLiveStickers | null {
  return requireOptionalNativeModule<NativeLiveStickers>('LiveStickers');
}

function ensureNative(): NativeLiveStickers {
  if (Platform.OS !== 'ios') {
    throw new LiveStickersNotSupported(
      `Live Stickers is not available on ${Platform.OS}`,
      'UNSUPPORTED_OS',
    );
  }
  const native = getNative();
  if (!native) {
    throw new LiveStickersNotSupported('LiveStickers native module is not registered', 'UNKNOWN');
  }
  return native;
}

export function isSupported(): boolean {
  if (Platform.OS !== 'ios') return false;
  const native = getNative();
  return native !== null && native.isSupported();
}

export function pickImageAndLiftSubjects(): Promise<LiveStickersResult> {
  try {
    return ensureNative().pickImageAndLiftSubjects();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function shareSticker(base64Png: string): Promise<void> {
  try {
    return ensureNative().shareSticker(base64Png);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const liveStickers: LiveStickersBridge = {
  isSupported,
  pickImageAndLiftSubjects,
  shareSticker,
};

export default liveStickers;
