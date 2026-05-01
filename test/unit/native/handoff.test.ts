/**
 * Unit tests: JS bridge — non-iOS path (T004).
 *
 * Tests the bridge contract per contracts/bridge.md § "Test contract".
 * This file directly imports `handoff.web.ts` (the non-iOS implementation).
 */

import * as handoffWeb from '@/native/handoff.web';

describe('handoff bridge (non-iOS)', () => {
  it('exports isAvailable as false', () => {
    expect(handoffWeb.isAvailable).toBe(false);
  });

  it('setCurrent rejects with HandoffNotSupported containing method name', async () => {
    const def: any = {
      activityType: 'test',
      title: 'Test',
      userInfo: {},
      requiredUserInfoKeys: [],
      isEligibleForHandoff: true,
      isEligibleForSearch: false,
      isEligibleForPrediction: false,
    };
    await expect(handoffWeb.setCurrent(def)).rejects.toThrow('setCurrent');
    await expect(handoffWeb.setCurrent(def)).rejects.toBeInstanceOf(handoffWeb.HandoffNotSupported);
  });

  it('resignCurrent rejects with HandoffNotSupported containing method name', async () => {
    await expect(handoffWeb.resignCurrent()).rejects.toThrow('resignCurrent');
    await expect(handoffWeb.resignCurrent()).rejects.toBeInstanceOf(handoffWeb.HandoffNotSupported);
  });

  it('getCurrent rejects with HandoffNotSupported containing method name', async () => {
    await expect(handoffWeb.getCurrent()).rejects.toThrow('getCurrent');
    await expect(handoffWeb.getCurrent()).rejects.toBeInstanceOf(handoffWeb.HandoffNotSupported);
  });

  it('addContinuationListener throws HandoffNotSupported synchronously', () => {
    const cb = jest.fn();
    expect(() => handoffWeb.addContinuationListener(cb)).toThrow('addContinuationListener');
    expect(() => handoffWeb.addContinuationListener(cb)).toThrow(handoffWeb.HandoffNotSupported);
  });

  it('HandoffNotSupported error class has correct name', () => {
    const error = new handoffWeb.HandoffNotSupported('testMethod');
    expect(error.name).toBe('HandoffNotSupported');
    expect(error.message).toContain('testMethod');
  });
});
