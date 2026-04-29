/**
 * Test: QuickLook Bridge Types (src/native/quicklook.types.ts)
 * Feature: 032-document-picker-quicklook
 *
 * Tests purely type-level and value-level invariants from
 * contracts/quicklook-bridge.contract.ts before bridge runtime
 * implementations exist.
 *
 * @see specs/032-document-picker-quicklook/contracts/quicklook-bridge.contract.ts
 */

import {
  NATIVE_MODULE_NAME,
  QuickLookBridge,
  QuickLookNotSupported,
  QuickLookPresentResult,
} from '@/native/quicklook.types';

describe('QuickLook Bridge Types', () => {
  describe('QuickLookNotSupported', () => {
    it('is a class whose instances pass instanceof checks (FR-014)', () => {
      const error = new QuickLookNotSupported('test message');
      expect(error).toBeInstanceOf(QuickLookNotSupported);
      expect(error).toBeInstanceOf(Error);
    });

    it('carries a stable name === "QuickLookNotSupported"', () => {
      const error = new QuickLookNotSupported();
      expect(error.name).toBe('QuickLookNotSupported');
    });

    it('preserves the message argument', () => {
      const error = new QuickLookNotSupported('custom message');
      expect(error.message).toBe('custom message');
    });
  });

  describe('NATIVE_MODULE_NAME', () => {
    it('equals "QuickLook" and is distinct from prior bridges', () => {
      expect(NATIVE_MODULE_NAME).toBe('QuickLook');
      // Distinct from prior modules (FR-013 / B1)
      expect(NATIVE_MODULE_NAME).not.toBe('AppIntents'); // 013
      expect(NATIVE_MODULE_NAME).not.toBe('WidgetCenter'); // 014/027/028
      expect(NATIVE_MODULE_NAME).not.toBe('FocusFilters'); // 029
      expect(NATIVE_MODULE_NAME).not.toBe('BackgroundTasks'); // 030
      expect(NATIVE_MODULE_NAME).not.toBe('Spotlight'); // 031
    });
  });

  describe('QuickLookPresentResult', () => {
    it('{ shown: true } typechecks', () => {
      const result: QuickLookPresentResult = { shown: true };
      expect(result.shown).toBe(true);
    });

    // Type-only test: { shown: false } must NOT typecheck
    // This is enforced by TypeScript at compile time via the literal type
  });

  describe('QuickLookBridge interface shape', () => {
    it('includes exactly isAvailable and present methods', () => {
      // Type assertion to ensure interface shape exists
      const mockBridge: QuickLookBridge = {
        isAvailable: () => true,
        present: async () => ({ shown: true }),
      };

      expect(typeof mockBridge.isAvailable).toBe('function');
      expect(typeof mockBridge.present).toBe('function');
    });

    it('isAvailable returns boolean', () => {
      const mockBridge: QuickLookBridge = {
        isAvailable: () => false,
        present: async () => ({ shown: true }),
      };

      expect(typeof mockBridge.isAvailable()).toBe('boolean');
    });

    it('present returns Promise<QuickLookPresentResult>', async () => {
      const mockBridge: QuickLookBridge = {
        isAvailable: () => true,
        present: async () => ({ shown: true }),
      };

      const result = await mockBridge.present('file://test.pdf');
      expect(result).toEqual({ shown: true });
    });
  });
});
