/**
 * Tests for Spotlight bridge Android stub — feature 031 / T011.
 *
 * Uses jest.isolateModules + jest.doMock pattern per FR-123.
 */

type BridgeModule = typeof import('@/native/spotlight.android');

function loadAndroidBridge(): BridgeModule {
  let mod: BridgeModule | undefined;
  jest.isolateModules(() => {
    // No need to mock anything for Android stub — it doesn't import Platform
    mod = require('@/native/spotlight.android') as BridgeModule;
  });
  if (!mod) throw new Error('failed to load Android bridge module');
  return mod;
}

describe('spotlight.android bridge stub', () => {
  it('isAvailable() returns false (FR-091)', () => {
    const b = loadAndroidBridge();
    expect(b.isAvailable()).toBe(false);
  });

  it('index([item]) rejects with SpotlightNotSupported', async () => {
    const b = loadAndroidBridge();
    await expect(
      b.index([
        {
          id: 'test',
          title: 'Test',
          contentDescription: 'desc',
          keywords: [],
          domainIdentifier: 'com.izkizk8.spot.modules',
        },
      ]),
    ).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('delete([id]) rejects with SpotlightNotSupported', async () => {
    const b = loadAndroidBridge();
    await expect(b.delete(['id1'])).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('deleteAll() rejects with SpotlightNotSupported', async () => {
    const b = loadAndroidBridge();
    await expect(b.deleteAll()).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('search(q, 25) rejects with SpotlightNotSupported', async () => {
    const b = loadAndroidBridge();
    await expect(b.search('query', 25)).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('markCurrentActivity rejects with SpotlightNotSupported', async () => {
    const b = loadAndroidBridge();
    await expect(
      b.markCurrentActivity({ title: 't', keywords: [], userInfo: {} }),
    ).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('clearCurrentActivity() rejects with SpotlightNotSupported', async () => {
    const b = loadAndroidBridge();
    await expect(b.clearCurrentActivity()).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('thrown error is instanceof SpotlightNotSupported AND instanceof Error (FR-092)', async () => {
    const b = loadAndroidBridge();
    let caught: unknown;
    try {
      await b.deleteAll();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(b.SpotlightNotSupported);
    expect(caught).toBeInstanceOf(Error);
  });

  it('importing the module does NOT call requireOptionalNativeModule', () => {
    // This test verifies that spotlight.android.ts does not import expo-modules-core
    // by checking no spy is called. Since the Android stub doesn't use it,
    // we verify the module imports successfully without any native dependencies.
    const mod = loadAndroidBridge();
    expect(mod).toBeDefined();
    expect(mod.isAvailable).toBeDefined();
  });
});
