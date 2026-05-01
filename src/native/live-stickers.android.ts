/**
 * Live Stickers Bridge — Android stub (feature 083).
 *
 * Live Stickers / VNGenerateForegroundInstanceMaskRequest is iOS-only.
 * All methods reject with `LiveStickersNotSupported`. MUST NOT import
 * the iOS variant.
 */

import {
  LiveStickersNotSupported,
  type LiveStickersBridge,
  type LiveStickersResult,
} from './live-stickers.types';

export { LiveStickersNotSupported };

const ERR = (): LiveStickersNotSupported =>
  new LiveStickersNotSupported('Live Stickers is not available on Android', 'UNSUPPORTED_OS');

export function isSupported(): boolean {
  return false;
}

export function pickImageAndLiftSubjects(): Promise<LiveStickersResult> {
  return Promise.reject(ERR());
}

export function shareSticker(_base64Png: string): Promise<void> {
  return Promise.reject(ERR());
}

export const liveStickers: LiveStickersBridge = {
  isSupported,
  pickImageAndLiftSubjects,
  shareSticker,
};

export default liveStickers;
