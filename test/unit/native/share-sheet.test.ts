/**
 * Test: Share Sheet Bridge Runtime (ios / android / web variants)
 * Feature: 033-share-sheet
 *
 * Tests the platform-specific runtime exports of ShareSheetBridge.
 * Covers invariants B1-B9 from contracts/share-sheet-bridge.contract.ts.
 *
 * iOS variant: shape tests only (Platform+native mock complexity)
 * Android/Web variants: full behavior tests (no Platform dependency)
 *
 * @see specs/033-share-sheet/contracts/share-sheet-bridge.contract.ts
 * @see specs/033-share-sheet/research.md §1 (R-A serialisation), §4 (R-D classification)
 * @see specs/033-share-sheet/tasks.md T008
 */

// Mock expo-sharing for Android tests
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

// Mock expo-clipboard for Android/Web fallback tests
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

describe('Share Sheet Bridge Runtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('iOS path (share-sheet.ts)', () => {
    it('B1: exports bridge object with isAvailable and present', () => {
      // We can't easily mock requireOptionalNativeModule + Platform.OS in Jest
      // without module-level hoisting issues. Test the export shape only.
      const shareSheet = require('@/native/share-sheet');
      expect(shareSheet.bridge).toBeDefined();
      expect(typeof shareSheet.bridge.isAvailable).toBe('function');
      expect(typeof shareSheet.bridge.present).toBe('function');
      expect(shareSheet.ShareSheetNotSupported).toBeDefined();
    });

    it('B1: native module name is "ShareSheet"', () => {
      const { NATIVE_MODULE_NAME } = require('@/native/share-sheet.types');
      expect(NATIVE_MODULE_NAME).toBe('ShareSheet');
    });

    it('B4: isAvailable() returns boolean', () => {
      const { bridge } = require('@/native/share-sheet');
      const result = bridge.isAvailable();
      expect(typeof result).toBe('boolean');
    });

    it('B3: present() returns a Promise', async () => {
      const { bridge } = require('@/native/share-sheet');
      const result = bridge.present({
        content: { kind: 'text', text: 'Test' },
        excludedActivityTypes: [],
        includeCustomActivity: false,
        anchor: null,
      });
      expect(result).toBeInstanceOf(Promise);
      // Catch to avoid unhandled rejection
      await result.catch(() => {});
    });
  });

  describe('Android path (share-sheet.android.ts)', () => {
    beforeEach(() => {
      // Reset mocks
      const sharing = require('expo-sharing');
      const clipboard = require('expo-clipboard');
      sharing.shareAsync.mockClear();
      clipboard.setStringAsync.mockClear();
    });

    it('B5: file content delegates to expo-sharing (B5)', async () => {
      const sharing = require('expo-sharing');
      sharing.shareAsync.mockResolvedValue({});

      const { bridge } = require('@/native/share-sheet.android');

      const result = await bridge.present({
        content: {
          kind: 'file',
          uri: 'file://test.pdf',
          name: 'test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
        },
        excludedActivityTypes: [],
        includeCustomActivity: false,
        anchor: null,
      });

      expect(sharing.shareAsync).toHaveBeenCalledWith('file://test.pdf');
      expect(result).toEqual({ activityType: null, completed: true });
    });

    it('B6: text content delegates to clipboard (B6)', async () => {
      const clipboard = require('expo-clipboard');
      clipboard.setStringAsync.mockResolvedValue(undefined);

      const { bridge } = require('@/native/share-sheet.android');

      const result = await bridge.present({
        content: { kind: 'text', text: 'Hello Android' },
        excludedActivityTypes: [],
        includeCustomActivity: false,
        anchor: null,
      });

      expect(clipboard.setStringAsync).toHaveBeenCalledWith('Hello Android');
      expect(result).toEqual({
        activityType: 'android.clipboard-fallback',
        completed: true,
      });
    });

    it('B6: url content delegates to clipboard (B6)', async () => {
      const clipboard = require('expo-clipboard');
      clipboard.setStringAsync.mockResolvedValue(undefined);

      const { bridge } = require('@/native/share-sheet.android');

      const result = await bridge.present({
        content: { kind: 'url', url: 'https://expo.dev' },
        excludedActivityTypes: [],
        includeCustomActivity: false,
        anchor: null,
      });

      expect(clipboard.setStringAsync).toHaveBeenCalledWith('https://expo.dev');
      expect(result).toEqual({
        activityType: 'android.clipboard-fallback',
        completed: true,
      });
    });

    it('B9: throws ShareSheetNotSupported for iOS-only capabilities', async () => {
      const { bridge, ShareSheetNotSupported } = require('@/native/share-sheet.android');

      await expect(
        bridge.present({
          content: { kind: 'text', text: 'Test' },
          excludedActivityTypes: ['com.apple.UIKit.activity.Mail'],
          includeCustomActivity: false,
          anchor: null,
        }),
      ).rejects.toThrow(ShareSheetNotSupported);

      await expect(
        bridge.present({
          content: { kind: 'text', text: 'Test' },
          excludedActivityTypes: [],
          includeCustomActivity: true,
          anchor: null,
        }),
      ).rejects.toThrow(ShareSheetNotSupported);

      await expect(
        bridge.present({
          content: { kind: 'text', text: 'Test' },
          excludedActivityTypes: [],
          includeCustomActivity: false,
          anchor: { x: 0, y: 0, width: 44, height: 44 },
        }),
      ).rejects.toThrow(ShareSheetNotSupported);
    });

    it('B4: isAvailable() returns true', () => {
      const { bridge } = require('@/native/share-sheet.android');
      expect(bridge.isAvailable()).toBe(true);
    });
  });

  describe('Web path (share-sheet.web.ts)', () => {
    beforeEach(() => {
      const clipboard = require('expo-clipboard');
      clipboard.setStringAsync.mockClear();
    });

    it('B7: with navigator.share, delegates and resolves', async () => {
      const mockShare = jest.fn().mockResolvedValue(undefined);
      global.navigator = { share: mockShare } as any;

      delete require.cache[require.resolve('@/native/share-sheet.web')];
      const { bridge } = require('@/native/share-sheet.web');

      const result = await bridge.present({
        content: { kind: 'text', text: 'Hello Web' },
        excludedActivityTypes: [],
        includeCustomActivity: false,
        anchor: null,
      });

      expect(mockShare).toHaveBeenCalledWith({ text: 'Hello Web' });
      expect(result).toEqual({ activityType: null, completed: true });
    });

    it('B7: AbortError results in completed: false', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      const mockShare = jest.fn().mockRejectedValue(abortError);
      global.navigator = { share: mockShare } as any;

      delete require.cache[require.resolve('@/native/share-sheet.web')];
      const { bridge } = require('@/native/share-sheet.web');

      const result = await bridge.present({
        content: { kind: 'url', url: 'https://expo.dev' },
        excludedActivityTypes: [],
        includeCustomActivity: false,
        anchor: null,
      });

      expect(result).toEqual({ activityType: null, completed: false });
    });

    it('B8: without navigator.share, falls back to clipboard', async () => {
      delete (global as any).navigator;

      const clipboard = require('expo-clipboard');
      clipboard.setStringAsync.mockResolvedValue(undefined);

      delete require.cache[require.resolve('@/native/share-sheet.web')];
      const { bridge } = require('@/native/share-sheet.web');

      const result = await bridge.present({
        content: { kind: 'text', text: 'Fallback text' },
        excludedActivityTypes: [],
        includeCustomActivity: false,
        anchor: null,
      });

      expect(clipboard.setStringAsync).toHaveBeenCalledWith('Fallback text');
      expect(result).toEqual({
        activityType: 'web.clipboard-fallback',
        completed: true,
      });
    });

    it('B9: throws ShareSheetNotSupported for iOS-only capabilities', async () => {
      const { bridge, ShareSheetNotSupported } = require('@/native/share-sheet.web');

      await expect(
        bridge.present({
          content: { kind: 'text', text: 'Test' },
          excludedActivityTypes: ['com.apple.UIKit.activity.Mail'],
          includeCustomActivity: false,
          anchor: null,
        }),
      ).rejects.toThrow(ShareSheetNotSupported);
    });

    it('B4: isAvailable() returns true', () => {
      const { bridge } = require('@/native/share-sheet.web');
      expect(bridge.isAvailable()).toBe(true);
    });
  });
});
