/**
 * Live Stickers Bridge Types
 * Feature: 083-live-stickers
 *
 * Shared type definitions for the Live Stickers bridge. iOS 17+
 * `VNGenerateForegroundInstanceMaskRequest` exposed through an Expo
 * Module surface.
 */

export type StickerSubject = {
  /** base-64 PNG of the lifted subject */
  base64Png: string;
  /** bounding rect in image coordinates */
  rect: { x: number; y: number; width: number; height: number };
};

export type LiveStickersResult = {
  subjects: StickerSubject[];
};

export type LiveStickersError =
  | 'UNSUPPORTED_OS'
  | 'PERMISSION_DENIED'
  | 'NO_SUBJECT_FOUND'
  | 'CANCELLED'
  | 'UNKNOWN';

export type LiveStickersBridge = {
  isSupported: () => boolean;
  pickImageAndLiftSubjects: () => Promise<LiveStickersResult>;
  shareSticker: (base64Png: string) => Promise<void>;
};

export class LiveStickersNotSupported extends Error {
  readonly code: LiveStickersError;

  constructor(message: string, code: LiveStickersError = 'UNSUPPORTED_OS') {
    super(message);
    this.name = 'LiveStickersNotSupported';
    this.code = code;
  }
}
